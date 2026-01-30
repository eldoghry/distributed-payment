import { Injectable } from '@nestjs/common';

@Injectable()
export class MockPaymentGateway {
  async charge(amount: number): Promise<{ success: boolean }> {
    // Simulate real-world unpredictability
    // const shouldFail = Math.random() < 0.1; // 60% success rate
    const shouldFail = true; // 60% success rate
    console.log(`Charging amount: ${amount}. Success: ${!shouldFail}`);

    if (shouldFail) {
      throw new Error('Mock payment gateway failure');
    }

    return { success: true };
  }

  async refund(amount: number): Promise<{ success: boolean }> {
    console.log(`Refunded amount: ${amount}`);
    return { success: true };
  }
}
