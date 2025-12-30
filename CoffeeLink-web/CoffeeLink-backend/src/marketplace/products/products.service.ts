import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async createProduct(userId: string, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        sellerId: userId,
        ...dto,
      },
    });
  }

  async getProducts() {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        seller: {
          select: {
            firstName: true,
            lastName: true,
            profile: {
              select: {
                companyName: true,
              },
            },
          },
        },
      },
    });
  }
}
