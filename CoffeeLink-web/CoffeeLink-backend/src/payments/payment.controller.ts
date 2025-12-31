import { Body, Controller, Post, UseGuards, BadRequestException, Req, Headers } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { PaymentService } from './payment.service';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StripeWebhookGuard } from './guards/webhook.guard';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @UseGuards(JwtGuard)
  @Post('checkout')
  @ApiOperation({ summary: 'Start a checkout session (Stripe/Webpay)' })
  async checkout(
      @Body() body: { provider: 'STRIPE' | 'WEBPAY', items: { id: string, quantity: number }[] },
      @GetUser('id') userId: string
  ) {
      if (!body.items || body.items.length === 0) {
          throw new BadRequestException('Cart is empty');
      }
      return this.paymentService.initiateCheckout(body.items, userId, body.provider);
  }

  // --------------------------------------------------------
  // WEBHOOKS (Public but Protected by Signature)
  // --------------------------------------------------------
  
  @Post('webhook/stripe')
  @UseGuards(StripeWebhookGuard)
  async stripeWebhook(@Req() req: any) {
      // Logic handled in service, Guard ensures authenticity
      // In a real app with 'express.raw', we'd pass the raw body to the guard construction
      // Here we assume the body is already parsed json for the mock
      return this.paymentService.handleStripeWebhook(req.body);
  }
}