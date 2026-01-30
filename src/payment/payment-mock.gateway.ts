import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

@Injectable()
export class MockPaymentGateway {
  async charge(
    amount: number,
  ): Promise<{ success: boolean; paymentId: string }> {
    // Simulate real-world unpredictability
    const random = Math.random();
    const shouldFail = random < 0.1; // 90% success rate
    console.log(`💰 Charging amount: ${amount}. Success: ${!shouldFail}`);

    if (shouldFail) {
      throw new Error('Mock payment gateway failure');
    }

    return { success: true, paymentId: randomBytes(10).toString('hex') };
  }

  async refund(
    amount: number,
    paymentId: string,
  ): Promise<{ success: boolean }> {
    console.log(`🔙 Refunded amount: ${amount} for paymentId: ${paymentId}`);
    return { success: true };
  }
}
