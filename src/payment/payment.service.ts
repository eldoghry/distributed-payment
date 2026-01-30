import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderService } from 'src/order/order.service';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { MockPaymentGateway } from './payment-mock.gateway';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly gateway: MockPaymentGateway,
  ) {}

  async charge(orderId: number, amount: number) {
    const payment = this.paymentRepo.create({
      orderId,
      amount,
      status: PaymentStatus.INIT,
    });

    await this.paymentRepo.save(payment);

    // 🔥 External dependency
    try {
      const result = await this.gateway.charge(payment.amount);
      await this.updatePaymentStatus(orderId, PaymentStatus.SUCCESS);
      return result;
    } catch (error) {
      console.error('Payment gateway error:', error);
      await this.updatePaymentStatus(orderId, PaymentStatus.FAILED);
      throw new Error('Payment  failed');
    }
  }

  async refund(orderId: number) {
    const payment = await this.paymentRepo.findOneBy({ orderId });

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    try {
      await this.gateway.refund(payment.amount);
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
}
