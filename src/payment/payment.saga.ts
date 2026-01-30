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

    if (order.status !== 'CREATED') {
      throw new BadRequestException(
        'Order is not in a valid state for payment',
      );
    }

    try {
      await this.paymentService.charge(orderId, order.amount);

      await this.orderService.markAsPaid(orderId);
      return { success: true };
    } catch (error) {
      await this.orderService.markAsFailed(orderId);
      throw error;
    }
  }
}
