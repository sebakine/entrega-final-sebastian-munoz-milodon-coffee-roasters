import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/product.dto';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorator/roles.decorator';
import { UserRole } from '@prisma/client';
import { GetUser } from '../../auth/decorator/get-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Marketplace - Products')
@Controller('marketplace/products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ROASTER, UserRole.SUPPLIER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product (Roasters/Suppliers only)' })
  createProduct(@GetUser('id') userId: string, @Body() dto: CreateProductDto) {
    return this.productsService.createProduct(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active products' })
  getProducts() {
    return this.productsService.getProducts();
  }
}
