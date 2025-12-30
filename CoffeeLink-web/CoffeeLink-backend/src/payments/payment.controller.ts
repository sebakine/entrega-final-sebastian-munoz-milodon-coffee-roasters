import { Body, Controller, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(
    private paymentService: PaymentService,
    private prisma: PrismaService
  ) {}

  @UseGuards(JwtGuard)
  @Post('checkout')
  async checkout(@Body() body: { provider: 'STRIPE' | 'WEBPAY', items: { id: string, quantity: number }[] }) {
      if (!body.items || body.items.length === 0) {
          throw new BadRequestException('Cart is empty');
      }

      let calculatedTotal = 0;

      // SECURITY: Recalculate total from DB to prevent tampering
      for (const item of body.items) {
          const product = await this.prisma.product.findUnique({
              where: { id: item.id }
          });

          if (!product) {
              throw new BadRequestException(`Product ID ${item.id} not found`);
          }

          // Use Decimal to Number conversion carefully or maintain Decimal math
          // Here simplistic for MVP
          calculatedTotal += Number(product.price) * item.quantity;
      }

      // Generate a temporary Order ID (In real app, create Order entity first)
      const orderId = `ORD-${Date.now()}`;

      return this.paymentService.createPaymentSession(body.provider, calculatedTotal, orderId);
  }
}
