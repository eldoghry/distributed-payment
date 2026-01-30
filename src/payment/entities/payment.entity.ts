import { Order } from 'src/order/entities/order.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';

export enum PaymentStatus {
  INIT = 'INIT',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @Column()
  amount: number;

  @Column({ nullable: true })
  paymentId: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
  })
  status: PaymentStatus;

  @OneToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ nullable: false, unique: true })
  idempotencyKey: string;

  paid(paymentId: string) {
    this.paidAt = new Date();
    this.paymentId = paymentId;
    this.status = PaymentStatus.SUCCESS;
  }

  fail() {
    this.status = PaymentStatus.FAILED;
  }
}
