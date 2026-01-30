import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderService } from 'src/order/order.service';
import { PaymentService } from '../payment.service';
import { PaymentStatus } from '../entities/payment.entity';
import { retry } from 'src/helper';
import { InjectRepository } from '@nestjs/typeorm';
import {
  PaymentSaga,
  PaymentSagaStatus,
  PaymentSagaStep,
} from '../entities/payament-saga.entity';
import { Repository } from 'typeorm';
import { DistributedLockService } from 'src/redis/distributed-lock.service';

@Injectable()
export class DurablePaymentSagaOrchestrator {
  constructor(
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
    @InjectRepository(PaymentSaga)
    private readonly sagaRepo: Repository<PaymentSaga>,
    private readonly lockService: DistributedLockService,
  ) {}

  async execute(orderId: number) {
    const order = await this.orderService.getPayableOrder(orderId);

    const lockKey = `saga_lock_${orderId}`;
    const ownerId = `orchestrator_${Date.now()}_${Math.random()}`;
    const timeOnSec = 10;

    const refreshLocking = setInterval(
      () => this.lockService.refresh(lockKey, ownerId, 10000),
      5000,
    );

    try {
      const acquire = await this.lockService.acquire(
        lockKey,
        ownerId,
        timeOnSec,
      );

      if (!acquire)
        throw new Error('Another orchestrator is executing this saga');

      // step 0: load or create saga record
      let saga = await this.sagaRepo.findOne({ where: { orderId } });
      if (!saga) {
        saga = this.sagaRepo.create({
          orderId,
          steps: {
            chargePayment: PaymentSagaStep.PENDING,
            markOrderPaid: PaymentSagaStep.PENDING,
          },
        });
        await this.sagaRepo.save(saga);
      }

      if (saga.status !== PaymentSagaStatus.IN_PROGRESS) {
        throw new BadRequestException(
          `Cannot execute saga with status: ${saga.status}`,
        );
      }

      if (saga.steps.chargePayment !== PaymentSagaStep.SUCCESS) {
        const idempotencyKey = `order-${orderId}-payment`;
        let payment: { success: boolean; paymentId: string } | null = null;

        // step 1: charge payment
        try {
          payment = await retry(
            async () =>
              this.paymentService.charge(orderId, order.amount, idempotencyKey),
            3,
            1000,
          );

          saga.steps.chargePayment = PaymentSagaStep.SUCCESS;
          saga.status = PaymentSagaStatus.IN_PROGRESS;
          await this.sagaRepo.save(saga);
        } catch (error) {
          saga.steps.chargePayment = PaymentSagaStep.FAILED;
          saga.status = PaymentSagaStatus.FAILED;
          await this.sagaRepo.save(saga);
          throw error;
        }
      }

      if (
        saga.steps.chargePayment === PaymentSagaStep.SUCCESS &&
        saga.steps.markOrderPaid !== PaymentSagaStep.SUCCESS
      ) {
        // step 2: mark order as paid
        try {
          await this.orderService.markAsPaid(orderId);
          saga.steps.markOrderPaid = PaymentSagaStep.SUCCESS;
          saga.status = PaymentSagaStatus.COMPLETED;
          await this.sagaRepo.save(saga);

          return {
            success: true,
            message: 'Order successfully marked as paid',
          };
        } catch (error) {
          saga.steps.markOrderPaid = PaymentSagaStep.FAILED;

          // refund payment if marking order as paid fails
          if (saga.steps.refundPayment !== PaymentSagaStep.SUCCESS) {
            await this.paymentService.refund(orderId);
            saga.steps.refundPayment = PaymentSagaStep.SUCCESS;
            saga.status = PaymentSagaStatus.FAILED;
          }

          await this.orderService.markAsFailed(orderId);
          await this.sagaRepo.save(saga);
          return { success: false, error: error?.message };
        }
      }
    } catch (error) {
      throw error;
      // console.error(error?.message);
    } finally {
      clearInterval(refreshLocking);
      await this.lockService.release(lockKey, ownerId);
    }
  }
}
