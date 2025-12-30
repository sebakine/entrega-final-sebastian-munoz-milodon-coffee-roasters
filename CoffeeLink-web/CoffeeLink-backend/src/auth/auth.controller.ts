import { Body, Controller, Get, Post, Req, Res, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
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
  
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req: Request) {
      // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
      // req.user is populated by GoogleStrategy -> validate
      const result = await this.authService.loginWithGoogle(req.user);
      
      this.setCookie(res, result.access_token);

      // Redirect to Frontend Dashboard or Home
      // Use env var for production safety
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/dashboard?login=success`);
  }

  // ----------------------------------------------------
  // EMAIL / PASSWORD AUTH
  // ----------------------------------------------------

  // POST /api/v1/auth/signup
  @Post('signup')
  async signup(@Body() dto: AuthDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.signup(dto);
    
    // Set HttpOnly Cookie
    this.setCookie(res, result.access_token);
    
    return { 
        message: 'Registration successful',
        user: result.user 
    };
  }

  // POST /api/v1/auth/login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async signin(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.signin(dto);
    
    // Set HttpOnly Cookie
    this.setCookie(res, result.access_token);

    return { 
        message: 'Login successful',
        user: result.user
    };
  }

  // POST /api/v1/auth/logout
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('Authentication', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    });
    return { message: 'Logged out successfully' };
  }

  // GET /api/v1/auth/me
  @UseGuards(JwtGuard)
  @Get('me')
  getMe(@GetUser() user: User) {
    return { user };
  }

  // Helper for setting cookies
  private setCookie(res: Response, token: string) {
      res.cookie('Authentication', token, {
          httpOnly: true, // JavaScript cannot access this (XSS Protection)
          secure: process.env.NODE_ENV === 'production', // True in Production (HTTPS)
          sameSite: 'lax', // CSRF Protection
          maxAge: 24 * 60 * 60 * 1000, // 1 Day
      });
  }
}