import { CanActivate, ExecutionContext, Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class StripeWebhookGuard implements CanActivate {
  private readonly logger = new Logger('StripeWebhookGuard');

  constructor(private config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const signature = request.headers['stripe-signature'];

    if (!signature) {
      this.logger.warn('Missing Stripe Signature');
      throw new BadRequestException('Missing Signature');
    }

    const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
        this.logger.error('STRIPE_WEBHOOK_SECRET not configured');
        // In dev/mock mode, we might allow it, but in "Audit" mode we deny.
        return false;
    }

    // In a real app, we verify the signature using the stripe library:
    // try {
    //   const event = stripe.webhooks.constructEvent(request.body, signature, webhookSecret);
    //   request['stripeEvent'] = event;
    //   return true;
    // } catch (err) { ... }

    // For this prototype/audit where we don't have the Stripe Library installed or keys:
    // We simulate verification success if the signature looks "valid" (mock).
    const sigString = Array.isArray(signature) ? signature[0] : signature;
    if (process.env.NODE_ENV !== 'production' && sigString?.startsWith('t=')) {
        return true;
    }

    // Strict mode: Fail if we can't verify (protects against fake payment events)
    this.logger.error(`Invalid Signature: ${signature}`);
    return false;
  }
}
