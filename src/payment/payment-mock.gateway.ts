import { Injectable } from '@nestjs/common';

@Injectable()
export class MockPaymentGateway {
  async charge(amount: number): Promise<{ success: boolean }> {
    // Simulate real-world unpredictability
    return { success: true };
  }
}
