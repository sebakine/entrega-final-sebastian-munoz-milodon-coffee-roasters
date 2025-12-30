import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getPendingBusinesses() {
    return this.prisma.businessProfile.findMany({
      where: { status: VerificationStatus.PENDING },
      include: { user: true }, // Include email and name details
    });
  }

  async approveBusiness(profileId: string) {
    const business = await this.prisma.businessProfile.findUnique({ where: { id: profileId } });
    if (!business) throw new NotFoundException('Business not found');

    return this.prisma.businessProfile.update({
      where: { id: profileId },
      data: { status: VerificationStatus.APPROVED },
    });
  }

  async rejectBusiness(profileId: string, reason: string) {
    const business = await this.prisma.businessProfile.findUnique({ where: { id: profileId } });
    if (!business) throw new NotFoundException('Business not found');

    return this.prisma.businessProfile.update({
      where: { id: profileId },
      data: { 
          status: VerificationStatus.REJECTED,
          adminNotes: reason
      },
    });
  }
}
