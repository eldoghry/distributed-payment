import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const order = this.orderRepo.create({
      ...createOrderDto,
      status: OrderStatus.CREATED,
    });

    return this.orderRepo.save(order);
  }

  async markAsPaid(orderId: number) {
    const order = await this.orderRepo.findOneBy({ id: orderId });
    if (!order) throw new Error('Order not found');

    if (order.status === OrderStatus.PAID) {
      console.log(`⚠️ Order ${orderId} is already marked as PAID.`);
      return;
    }

    order.status = OrderStatus.PAID;
    await this.orderRepo.save(order);

    console.log(`😄 Order ${orderId} marked as PAID.`);
  }

  async markAsFailed(orderId: number) {
    const order = await this.orderRepo.findOneBy({ id: orderId });
    if (!order) throw new Error('Order not found');

    order.status = OrderStatus.FAILED;
    await this.orderRepo.save(order);

    console.log(`😞 Order ${orderId} marked as FAILED due to payment failure.`);
  }

  async findByIdOrFail(orderId: number) {
    const order = await this.orderRepo.findOneBy({ id: orderId });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
