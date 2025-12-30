import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VerifiedBusinessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    // 1. Fetch complete business profile
    const business = await this.prisma.businessProfile.findUnique({
      where: { userId: user.id },
    });

    // 2. Check if business exists
    if (!business) {
        throw new ForbiddenException('You must register a business profile first.');
    }

    // 3. Check Verification Status
    if (business.status === 'PENDING') {
        throw new ForbiddenException('Your business account is under review. Please wait for approval.');
    }

    if (business.status === 'REJECTED') {
        throw new ForbiddenException('Your business verification was rejected. Please contact support.');
    }

    if (business.status === 'UNVERIFIED') {
        throw new ForbiddenException('You need to complete the verification process.');
    }

    return true; // APPROVED
  }
}
