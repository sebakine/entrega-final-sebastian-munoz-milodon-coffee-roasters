import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // --------------------------------------------------------
  // 1. REGISTER USER
  // --------------------------------------------------------
  async signup(dto: AuthDto) {
    // Check if user exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ForbiddenException('Credentials taken');

    // Hash Password
    const hash = await bcrypt.hash(dto.password, 10);

    // Determine Role (Default CONSUMER)
    // SECURITY: Removed auto-admin promotion for @coffeelink.cl emails to prevent privilege escalation attacks.
    // Admins must be manually promoted via Database or Super Admin Console.
    let role: UserRole = 'CONSUMER';
    
    const emailLower = dto.email.toLowerCase();
    // Auto-detect business types for faster onboarding (Optional, can be removed for stricter control)
    if (emailLower.includes('roaster') || emailLower.includes('vendor')) role = 'ROASTER';
    else if (emailLower.includes('cafe') || emailLower.includes('shop')) role = 'CAFE';

    // Create User
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: role,
        // Create empty profile automatically
        profile: {
          create: {
            avatarUrl: `https://ui-avatars.com/api/?name=${dto.firstName}+${dto.lastName}&background=random`
          }
        }
      },
    });

    // 📧 MOCK EMAIL SERVICE (SendGrid / AWS SES Placeholder)
    this.mockSendWelcomeEmail(user.email, user.firstName || 'Usuario');

    return this.signToken(user.id, user.email, user.role);
  }

  private mockSendWelcomeEmail(email: string, name: string) {
      console.log(`\n[EMAIL-SERVICE] 📨 Sending Welcome Email to: ${email}`);
      console.log(`[EMAIL-SERVICE] Subject: ¡Bienvenido a CoffeeLink, ${name}!`);
      console.log(`[EMAIL-SERVICE] Body: Gracias por unirte. Confirma tu cuenta aquí: https://coffeelink.cl/verify?token=xyz\n`);
  }

  // --------------------------------------------------------
  // 2. LOGIN USER
  // --------------------------------------------------------
  async signin(dto: LoginDto) {
    // Find User
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new ForbiddenException('Credentials incorrect');

    // Match Password
    const pwMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!pwMatches) throw new ForbiddenException('Credentials incorrect');

    if (!user.isActive) throw new ForbiddenException('Account disabled');

    return this.signToken(user.id, user.email, user.role);
  }

  // --------------------------------------------------------
  // 2.5. LOGIN WITH GOOGLE
  // --------------------------------------------------------
  async loginWithGoogle(googleUser: any) {
      const { email, firstName, lastName, picture } = googleUser;

      // 1. Check if user exists
      let user = await this.prisma.user.findUnique({
          where: { email },
      });

      // 2. If not, register them automatically
      if (!user) {
          // Determine Role (Default CONSUMER)
          let role: UserRole = 'CONSUMER';
          // Optional: Domain-based logic (e.g. corporate emails)
          
          user = await this.prisma.user.create({
              data: {
                  email,
                  // Since it's OAuth, we don't have a password. 
                  // We store a placeholder or manage this via a "provider" column in a better schema.
                  // For this schema, we'll hash a random secure string.
                  passwordHash: await bcrypt.hash(Math.random().toString(36) + Date.now(), 10),
                  firstName,
                  lastName,
                  role,
                  isEmailVerified: true, // Google verified it
                  profile: {
                      create: {
                          avatarUrl: picture
                      }
                  }
              }
          });
      }

      // 3. Return Token
      return this.signToken(user.id, user.email, user.role);
  }

  // --------------------------------------------------------
  // 3. GENERATE TOKENS
  // --------------------------------------------------------
  async signToken(userId: string, email: string, role: string) {
    const payload = {
      sub: userId,
      email,
      role,
    };

    const secret = this.config.get('JWT_SECRET');
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '1d', // Session duration
      secret: secret,
    });

    return {
      access_token: token,
      user: {
        id: userId,
        email: email,
        role: role
      }
    };
  }

  // --------------------------------------------------------
  // 4. VALIDATE USER (For Strategy)
  // --------------------------------------------------------
  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
    });
    if (!user) return null;
    const { passwordHash, ...result } = user;
    return result;
  }
}