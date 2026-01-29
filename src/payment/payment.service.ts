import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderService } from 'src/order/order.service';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { MockPaymentGateway } from './payment-mock.gateway';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderStatus } from 'src/order/entities/order.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly orderService: OrderService,
    private readonly gateway: MockPaymentGateway,
  ) {}

  async processPayment(orderId: number) {
    const order = await this.orderService.findByIdOrFail(orderId);

    if (order.status !== OrderStatus.CREATED) {
      throw new BadRequestException(
        'Order is not in a valid state for payment',
      );
    }

    const payment = this.paymentRepo.create({
      orderId,
      amount: order.amount,
      status: PaymentStatus.INIT,
    });

    await this.paymentRepo.save(payment);

    // 🔥 External dependency
    const result = await this.gateway.charge(payment.amount);

    if (result.success) {
      payment.status = PaymentStatus.SUCCESS;
      await this.paymentRepo.save(payment);

      // ❗ Direct synchronous call
      await this.orderService.markAsPaid(orderId);

      return { success: true };
    }

    payment.status = PaymentStatus.FAILED;
    await this.paymentRepo.save(payment);

    await this.orderService.markAsFailed(orderId);
    return { success: false };
  }
}
