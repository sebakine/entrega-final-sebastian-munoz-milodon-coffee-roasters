import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentService {
  constructor(private config: ConfigService) {}

  /**
   * Factory method to initiate payment based on provider
   */
  async createPaymentSession(provider: 'STRIPE' | 'WEBPAY', amount: number, orderId: string) {
      if (provider === 'STRIPE') {
          return this.createStripeSession(amount, orderId);
      } else if (provider === 'WEBPAY') {
          return this.createWebpayTransaction(amount, orderId);
      }
      throw new BadRequestException('Invalid Payment Provider');
  }

  // --- STRIPE IMPLEMENTATION (Placeholder) ---
  private async createStripeSession(amount: number, orderId: string) {
      // In Real implementation:
      // const session = await stripe.checkout.sessions.create({ ... })
      return {
          url: `https://checkout.stripe.com/pay/mock_session_${orderId}`, 
          sessionId: `sess_${Date.now()}`
      };
  }

  // --- WEBPAY PLUS IMPLEMENTATION (Placeholder) ---
  private async createWebpayTransaction(amount: number, orderId: string) {
      // In Real implementation:
      // const tx = await new WebpayPlus.Transaction().create(buyOrder, sessionId, amount, returnUrl);
      return {
          url: `https://webpay3gint.transbank.cl/webpayserver/initTransaction`, 
          token: `token_mock_${orderId}`,
          formAction: 'POST'
      };
  }
}
