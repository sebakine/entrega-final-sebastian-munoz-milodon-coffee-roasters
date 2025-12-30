import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductType } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({ example: 'Etiopía Yirgacheffe', description: 'Product Name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'etiopia-yirgacheffe-250g', description: 'Unique Slug' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: 'Floral and citrus notes...', description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 15000, description: 'Price in CLP' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 100, description: 'Stock quantity' })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({ enum: ProductType, default: ProductType.COFFEE_BEAN })
  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;
  
  @ApiProperty({ example: ['https://example.com/image.jpg'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}
