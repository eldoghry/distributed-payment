import { Controller, Post, Param } from '@nestjs/common';
import { PaymentSagaOrchestrator } from './payment.saga';

@Controller('payment')
export class PaymentController {
  constructor(private readonly saga: PaymentSagaOrchestrator) {}

  @Post(':orderId')
  async pay(@Param('orderId') orderId: number) {
    return this.saga.execute(orderId);
  }
}
