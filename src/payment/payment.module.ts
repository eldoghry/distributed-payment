import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { Payment } from './entities/payment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MockPaymentGateway } from './payment-mock.gateway';
import { OrderModule } from 'src/order/order.module';
import { PaymentSagaOrchestrator } from './sagas/payment.saga';
import { DurablePaymentSagaOrchestrator } from './sagas/durable-payment.saga';
import { PaymentSaga } from './entities/payament-saga.entity';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, PaymentSaga]),
    OrderModule,
    RedisModule,
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaymentSagaOrchestrator,
    MockPaymentGateway,
    DurablePaymentSagaOrchestrator,
  ],
})
export class PaymentModule {}
