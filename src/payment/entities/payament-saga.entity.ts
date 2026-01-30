import { Order } from 'src/order/entities/order.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  VersionColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

export enum PaymentSagaStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum PaymentSagaStep {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export type PaymentSagaStepKey =
  | 'chargePayment'
  | 'markOrderPaid'
  | 'refundPayment';

@Entity('payment-sagas')
export class PaymentSaga {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @Column({ enum: PaymentSagaStatus, default: PaymentSagaStatus.IN_PROGRESS })
  status: PaymentSagaStatus;

  @Column({ type: 'jsonb', default: {} })
  steps: Record<PaymentSagaStepKey, PaymentSagaStep>; // { chargePayment: 'SUCCESS', markOrderPaid: 'PENDING' }

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order: Order;
}
