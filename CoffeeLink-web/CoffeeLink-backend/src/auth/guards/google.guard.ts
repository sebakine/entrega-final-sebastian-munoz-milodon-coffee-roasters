import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  private readonly logger = new Logger(GoogleAuthGuard.name);

  constructor(private config: ConfigService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isDev = this.config.get('NODE_ENV') === 'development';
    const clientId = this.config.get('GOOGLE_CLIENT_ID');
    const isPlaceholder = !clientId || clientId === 'placeholder_client_id';

    // 🚀 DEV BYPASS: If no keys in Dev, skip Google and go to Mock
    if (isDev && isPlaceholder) {
      this.logger.warn('⚠️ No Google Keys detected. Using DEV MOCK bypass.');
      const response = context.switchToHttp().getResponse();
      response.redirect('/api/v1/auth/mock-google');
      return false; // Stop execution of standard Passport guard
    }

    return super.canActivate(context) as boolean;
  }
}
