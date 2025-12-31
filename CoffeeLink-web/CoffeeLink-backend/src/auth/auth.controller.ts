import { Body, Controller, Get, Post, Req, Res, UseGuards, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, LoginDto } from './dto/auth.dto';
import { Response, Request } from 'express';
import { JwtGuard } from './guards/jwt.guard';
import { GoogleAuthGuard } from './guards/google.guard';
import { GetUser } from './decorator/get-user.decorator';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ----------------------------------------------------
  // GOOGLE AUTHENTICATION
  // ----------------------------------------------------
  
  // 🛠️ MOCK ENDPOINT FOR DEV (Bypass Google)
  @Get('mock-google')
  async mockGoogleAuth(@Res({ passthrough: true }) res: Response) {
      if (process.env.NODE_ENV !== 'development') {
          throw new UnauthorizedException('Mock login only available in DEV');
      }
      
      const mockUser = {
          email: 'dev_user@coffeelink.cl',
          firstName: 'Dev',
          lastName: 'Tester',
          picture: 'https://ui-avatars.com/api/?name=Dev+Tester&background=0D8ABC&color=fff'
      };

      const result = await this.authService.loginWithGoogle(mockUser);
      this.setCookies(res, result.access_token, result.refresh_token);
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/dashboard?login=success`);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req: Request) {
      // Guard redirects to Google (or Mock)
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
      const result = await this.authService.loginWithGoogle(req.user);
      this.setCookies(res, result.access_token, result.refresh_token);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/dashboard?login=success`);
  }

  // ----------------------------------------------------
  // EMAIL / PASSWORD AUTH
  // ----------------------------------------------------
  @Post('signup')
  async signup(@Body() dto: AuthDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.signup(dto);
    this.setCookies(res, result.access_token, result.refresh_token);
    return { message: 'Registration successful', user: result.user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async signin(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.signin(dto);
    this.setCookies(res, result.access_token, result.refresh_token);
    return { message: 'Login successful', user: result.user };
  }

  @Post('logout')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@GetUser('id') userId: string, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(userId);
    this.clearCookies(res);
    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
      const refreshToken = req.cookies['Refresh'];
      if (!refreshToken) throw new UnauthorizedException('No Refresh Token');

      // We need the User ID to verify the token hash in DB.
      // Since the RT is a JWT, we can decode it (in a real app, we'd use a Guard or Strategy)
      // For now, we will let the service handle verification if we pass the payload from decoding
      // But simpler: The RT payload has 'sub' (userId).
      // We'll decode it manually here or assume the service can decode it.
      // Better approach: Let's extract the ID from the token if possible, or make the service accept just the token and decode it.
      // Ideally, we should have a RefreshTokenGuard.
      // For this step, I will simplify by trusting the service to decode and verify.
      
      // Wait, AuthService.refreshTokens needs userId.
      // I need to decode the token to get the userId.
      const payload = JSON.parse(Buffer.from(refreshToken.split('.')[1], 'base64').toString());
      const userId = payload.sub;

      const tokens = await this.authService.refreshTokens(userId, refreshToken);
      this.setCookies(res, tokens.access_token, tokens.refresh_token);
      
      return { message: 'Tokens refreshed' };
  }

  @UseGuards(JwtGuard)
  @Get('me')
  getMe(@GetUser() user: User) {
    return { user };
  }

  // ----------------------------------------------------
  // COOKIE HELPERS
  // ----------------------------------------------------
  private setCookies(res: Response, accessToken: string, refreshToken: string) {
      // 1. Access Token (Short-lived)
      res.cookie('Authentication', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 15 * 60 * 1000, // 15 Minutes
      });

      // 2. Refresh Token (Long-lived)
      res.cookie('Refresh', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/api/v1/auth', // Only send to Auth endpoints
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
      });
  }

  private clearCookies(res: Response) {
      res.clearCookie('Authentication');
      res.clearCookie('Refresh', { path: '/api/v1/auth' });
  }
}
