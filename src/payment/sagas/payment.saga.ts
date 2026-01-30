import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderService } from 'src/order/order.service';
import { PaymentService } from '../payment.service';
import { PaymentStatus } from '../entities/payment.entity';
import { retry } from 'src/helper';

@Injectable()
export class PaymentSagaOrchestrator {
  constructor(
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
  ) {}

  async execute(orderId: number) {
    const order = await this.orderService.getPayableOrder(orderId);
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
    } catch (error) {
      throw error;
    }

    // step 2: mark order as paid
    try {
      if (!payment?.success) throw new Error('Payment failed');

      await this.orderService.markAsPaid(orderId);
      return { success: true, payment };
    } catch (error) {
      if (payment?.success && payment?.paymentId) {
        await this.paymentService.refund(orderId);
      }

      return { success: false, error: error?.message };
    }
  }
}
