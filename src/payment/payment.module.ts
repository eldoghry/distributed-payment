import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { Payment } from './entities/payment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MockPaymentGateway } from './payment-mock.gateway';
import { OrderModule } from 'src/order/order.module';
import { PaymentSagaOrchestrator } from './payment.saga';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), OrderModule],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentSagaOrchestrator, MockPaymentGateway],
})
export class PaymentModule {}
