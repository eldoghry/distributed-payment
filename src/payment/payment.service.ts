import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderService } from 'src/order/order.service';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { MockPaymentGateway } from './payment-mock.gateway';
import { InjectRepository } from '@nestjs/typeorm';
import { sleep } from 'src/helper';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly gateway: MockPaymentGateway,
  ) {}

  async charge(orderId: number, amount: number, idempotencyKey: string) {
    await sleep(5000); // Simulate network delay

    const existing = await this.paymentRepo.findOneBy({ idempotencyKey });

    if (existing && existing.status === PaymentStatus.SUCCESS) {
      console.log(
        '⚠️ Duplicate payment attempt detected. Returning existing payment.',
      );
      return {
        success: true,
        paymentId: existing.paymentId,
      };
    }

    const payment = existing
      ? existing
      : await this.create(orderId, amount, idempotencyKey);

    // 🔥 External dependency
    try {
      const paymentRes = await this.gateway.charge(payment.amount);
      payment.paid(paymentRes.paymentId);
      await this.paymentRepo.save(payment);

      return paymentRes;
    } catch (error) {
      console.error('Payment gateway error:', error);
      payment.fail();
      await this.paymentRepo.save(payment);
      throw new Error(`💥Payment failed: ${error?.message}`);
    }
  }

  async refund(orderId: number, paymentId: string) {
    const payment = await this.paymentRepo.findOneBy({ orderId });

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    if (payment.paymentId !== paymentId) {
      throw new BadRequestException('Payment ID mismatch');
    }

    try {
      await this.gateway.refund(payment.amount, paymentId);
      payment.status = PaymentStatus.REFUNDED;
      await this.paymentRepo.save(payment);
    } catch (error) {
      throw new BadRequestException('Failed to refund payment');
    }
  }

  async updatePaymentStatus(orderId: number, status: PaymentStatus) {
    const payment = await this.paymentRepo.findOneBy({ orderId });

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    payment.status = status;
    await this.paymentRepo.save(payment);
  }

  private async create(
    orderId: number,
    amount: number,
    idempotencyKey: string,
  ) {
    const payment = this.paymentRepo.create({
      orderId,
      amount,
      status: PaymentStatus.INIT,
      idempotencyKey,
    });

    return await this.paymentRepo.save(payment);
  }
}
