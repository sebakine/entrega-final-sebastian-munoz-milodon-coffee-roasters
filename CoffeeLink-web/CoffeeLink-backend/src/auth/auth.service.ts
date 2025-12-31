import { ForbiddenException, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto, LoginDto } from './dto/auth.dto';
import * as argon2 from 'argon2';
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
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ForbiddenException('Credentials taken');

    const hash = await argon2.hash(dto.password);

    let role: UserRole = 'CONSUMER';
    const emailLower = dto.email.toLowerCase();
    if (emailLower.includes('roaster') || emailLower.includes('vendor')) role = 'ROASTER';
    else if (emailLower.includes('cafe') || emailLower.includes('shop')) role = 'CAFE';

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: role,
        profile: {
          create: {
            avatarUrl: `https://ui-avatars.com/api/?name=${dto.firstName}+${dto.lastName}&background=random`
          }
        }
      },
    });

    this.mockSendWelcomeEmail(user.email, user.firstName || 'Usuario');

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    
    return {
        ...tokens,
        user: { id: user.id, email: user.email, role: user.role }
    };
  }

  // --------------------------------------------------------
  // 2. LOGIN USER
  // --------------------------------------------------------
  async signin(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new ForbiddenException('Credentials incorrect');

    const pwMatches = await argon2.verify(user.passwordHash, dto.password);
    if (!pwMatches) throw new ForbiddenException('Credentials incorrect');

    if (!user.isActive) throw new ForbiddenException('Account disabled');

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return {
        ...tokens,
        user: { id: user.id, email: user.email, role: user.role }
    };
  }

  // --------------------------------------------------------
  // 2.5. LOGIN WITH GOOGLE
  // --------------------------------------------------------
  async loginWithGoogle(googleUser: any) {
      const { email, firstName, lastName, picture } = googleUser;
      let user = await this.prisma.user.findUnique({ where: { email } });

      if (!user) {
          user = await this.prisma.user.create({
              data: {
                  email,
                  passwordHash: await argon2.hash(Math.random().toString(36) + Date.now()),
                  firstName,
                  lastName,
                  role: 'CONSUMER',
                  isEmailVerified: true,
                  profile: { create: { avatarUrl: picture } }
              }
          });
      }

      const tokens = await this.getTokens(user.id, user.email, user.role);
      await this.updateRefreshToken(user.id, tokens.refresh_token);

      return {
          ...tokens,
          user: { id: user.id, email: user.email, role: user.role }
      };
  }

  // --------------------------------------------------------
  // 3. LOGOUT
  // --------------------------------------------------------
  async logout(userId: string) {
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        refreshToken: { not: null },
      },
      data: { refreshToken: null },
    });
    return true;
  }

  // --------------------------------------------------------
  // 4. REFRESH TOKENS
  // --------------------------------------------------------
  async refreshTokens(userId: string, rt: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.refreshToken) throw new ForbiddenException('Access Denied');

    const rtMatches = await argon2.verify(user.refreshToken, rt);
    if (!rtMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    
    return tokens;
  }

  // --------------------------------------------------------
  // HELPER: UPDATE RT HASH
  // --------------------------------------------------------
  async updateRefreshToken(userId: string, rt: string) {
    const hash = await argon2.hash(rt);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hash },
    });
  }

  // --------------------------------------------------------
  // HELPER: GENERATE TOKENS
  // --------------------------------------------------------
  async getTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const secret = this.config.get('JWT_SECRET');

    const [at, rt] = await Promise.all([
      this.jwt.signAsync(payload, {
        expiresIn: '15m', // Short-lived Access Token
        secret: secret,
      }),
      this.jwt.signAsync(payload, {
        expiresIn: '7d', // Long-lived Refresh Token
        secret: secret,
      }),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
    });
    if (!user) return null;
    const { passwordHash, refreshToken, ...result } = user;
    return result;
  }

  private readonly logger = new Logger(AuthService.name);

  private mockSendWelcomeEmail(email: string, name: string) {
      this.logger.log(`📨 [EMAIL-MOCK] Sending Welcome Email to: ${email}`);
      this.logger.debug(`Subject: ¡Bienvenido a CoffeeLink, ${name}!`);
      this.logger.debug(`Body: Gracias por unirte. Confirma tu cuenta aquí: https://coffeelink.cl/verify?token=xyz`);
  }
}
