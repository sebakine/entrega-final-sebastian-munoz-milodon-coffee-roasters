import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
      private config: ConfigService,
      private prisma: PrismaService
  ) {}

  /**
   * Securely calculates order total and creates a payment session
   */
  async initiateCheckout(items: { id: string, quantity: number }[], userId: string, provider: 'STRIPE' | 'WEBPAY') {
      // 1. Calculate Total Securely (Server-Side)
      let totalAmount = 0;
      const orderItemsData = [];

      for (const item of items) {
          const product = await this.prisma.product.findUnique({ where: { id: item.id } });
          if (!product) throw new BadRequestException(`Product ${item.id} not found`);
          
          // Check Stock
          if (product.stock < item.quantity) {
              throw new BadRequestException(`Insufficient stock for ${product.name}`);
          }

          const price = Number(product.price); // Handle Decimal carefully in production
          totalAmount += price * item.quantity;
          
          orderItemsData.push({
              productId: product.id,
              quantity: item.quantity,
              price: product.price
          });
      }

      // 2. Create Pending Order Record
      const order = await this.prisma.order.create({
          data: {
              customerId: userId,
              totalAmount: totalAmount,
              status: 'PENDING',
              paymentMethod: provider,
              items: {
                  create: orderItemsData
              }
          }
      });

      this.logger.log(`Order ${order.id} created for ${totalAmount}`);

      // 3. Delegate to Provider
      if (provider === 'STRIPE') {
          return this.createStripeSession(order.id, totalAmount);
      } else if (provider === 'WEBPAY') {
          return this.createWebpayTransaction(order.id, totalAmount);
      }
      
      throw new BadRequestException('Invalid Provider');
  }

  // --- STRIPE IMPLEMENTATION ---
  private async createStripeSession(orderId: string, amount: number) {
      // Real implementation would use 'stripe' library
      return {
          url: `https://checkout.stripe.com/pay/mock_${orderId}`, 
          sessionId: `sess_${Date.now()}_${orderId}`
      };
  }

  // --- WEBPAY PLUS IMPLEMENTATION ---
  private async createWebpayTransaction(orderId: string, amount: number) {
      return {
          url: `https://webpay3gint.transbank.cl/webpayserver/initTransaction`, 
          token: `token_${Date.now()}_${orderId}`,
          formAction: 'POST'
      };
  }

  // --- WEBHOOK HANDLING (CRITICAL) ---
  async handleStripeWebhook(event: any) {
      // In real code, 'event' comes from constructEvent in Guard
      // Here we parse the mock event
      
      this.logger.log(`Processing Stripe Event: ${event.type}`);

      switch (event.type) {
          case 'checkout.session.completed':
              const session = event.data.object;
              await this.fulfillOrder(session.client_reference_id || session.metadata.orderId);
              break;
          case 'payment_intent.payment_failed':
              // Handle failure (email user, release stock)
              break;
      }
      return { received: true };
  }

  private async fulfillOrder(orderId: string) {
      if (!orderId) return;
      
      this.logger.log(`Fulfilling Order: ${orderId}`);
      
      // Atomic Transaction: Update Order & Reduce Stock
      await this.prisma.$transaction(async (tx) => {
          const order = await tx.order.update({
              where: { id: orderId },
              data: { status: 'PAID' },
              include: { items: true }
          });

          for (const item of order.items) {
              await tx.product.update({
                  where: { id: item.productId },
                  data: { stock: { decrement: item.quantity } }
              });
          }
      });
  }
}