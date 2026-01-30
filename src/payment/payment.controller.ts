import { Controller, Post, Param } from '@nestjs/common';
// import { PaymentSagaOrchestrator } from './sagas/payment.saga';
import { DurablePaymentSagaOrchestrator } from './sagas/durable-payment.saga';

@Controller('payment')
export class PaymentController {
  constructor(private readonly saga: DurablePaymentSagaOrchestrator) {}

  @Post(':orderId')
  async pay(@Param('orderId') orderId: number) {
    return this.saga.execute(orderId);
  }
}
