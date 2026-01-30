import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderService } from 'src/order/order.service';
import { PaymentService } from './payment.service';
import { PaymentStatus } from './entities/payment.entity';

@Injectable()
export class PaymentSagaOrchestrator {
  constructor(
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
  ) {}

  async execute(orderId: number) {
    const order = await this.orderService.findByIdOrFail(orderId);
    let paymentId: string | null = null;

    if (order.status !== 'CREATED') {
      throw new BadRequestException(
        'Order is not in a valid state for payment',
      );
    }

    try {
      const payment = await this.paymentService.charge(orderId, order.amount);
      paymentId = payment.paymentId;
      await this.orderService.markAsPaid(orderId);

      return { success: true, payment };
    } catch (error) {
      await this.orderService.markAsFailed(orderId);

      if (paymentId) {
        await this.paymentService.refund(orderId, paymentId);
      }

      return { success: false, error: error?.message };
    }
  }
}
