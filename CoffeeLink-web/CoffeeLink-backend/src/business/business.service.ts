import { ConflictException, Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessProfileDto, BusinessType } from './dto/create-business.dto';
import { UserRole, VerificationStatus } from '@prisma/client';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  /**
   * Transforms a Consumer User into a Business User (Pending Verification)
   */
  async onboardBusiness(userId: string, dto: CreateBusinessProfileDto) {
    // 1. Check if user already has a business profile
    const existingProfile = await this.prisma.businessProfile.findUnique({
      where: { userId },
    });
    if (existingProfile) {
      throw new ConflictException('User already has a business profile associated.');
    }

    // 2. Check if RUT is already taken by another account
    const rutTaken = await this.prisma.businessProfile.findUnique({
      where: { rut: dto.rut },
    });
    if (rutTaken) {
      throw new ConflictException('This RUT is already registered to another account.');
    }

    // 3. Determine new Role based on request type
    let newRole: UserRole = UserRole.ROASTER;
    if (dto.type === BusinessType.CAFE) newRole = UserRole.CAFE;
    if (dto.type === BusinessType.SUPPLIER) newRole = UserRole.SUPPLIER;

    // 4. ATOMIC TRANSACTION
    // We update the user role AND create the business profile simultaneously.
    return this.prisma.$transaction(async (tx) => {
      
      // Create the Business Profile
      const business = await tx.businessProfile.create({
        data: {
          userId,
          fantasyName: dto.fantasyName,
          legalName: dto.legalName,
          rut: dto.rut,
          status: VerificationStatus.PENDING, // Always starts as Pending
          documentsUrl: dto.documentUrl ? [dto.documentUrl] : [],
          subscription: 'FREE', // Default Tier
        },
      });

      // Update User Role
      const user = await tx.user.update({
        where: { id: userId },
        data: { role: newRole },
      });

      return { business, user };
    });
  }

  /**
   * Get my business status
   */
  async getMyBusiness(userId: string) {
    const business = await this.prisma.businessProfile.findUnique({
        where: { userId }
    });
    if(!business) return null;
    return business;
  }
}
