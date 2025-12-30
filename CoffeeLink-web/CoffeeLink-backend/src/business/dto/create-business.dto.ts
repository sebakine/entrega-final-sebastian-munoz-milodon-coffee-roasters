import { IsString, IsNotEmpty, IsEnum, Matches, IsUrl, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Definimos los tipos de negocio permitidos para el onboarding
export enum BusinessType {
  ROASTER = 'ROASTER',
  CAFE = 'CAFE',
  SUPPLIER = 'SUPPLIER'
}

export class CreateBusinessProfileDto {
  @ApiProperty({ description: 'The type of business applying', enum: BusinessType })
  @IsEnum(BusinessType)
  type: BusinessType;

  @ApiProperty({ description: 'Commercial Name (Fantasy Name)', example: 'Milodon Coffee' })
  @IsString()
  @IsNotEmpty()
  fantasyName: string;

  @ApiProperty({ description: 'Legal Company Name', example: 'Inversiones Milodon SpA' })
  @IsString()
  @IsNotEmpty()
  legalName: string;

  @ApiProperty({ description: 'Chilean Tax ID (RUT)', example: '76.123.456-K' })
  @IsString()
  @IsNotEmpty()
  // Regex básica para RUT Chileno (con puntos y guión)
  @Matches(/^(\d{1,3}(\.?\d{3}){2})\-([\dkK])$/, {
    message: 'RUT must be in valid format (e.g. 12.345.678-9)',
  })
  rut: string;

  @ApiProperty({ description: 'URL to the PDF of "Carpeta Tributaria" or "E-Rut"', required: false })
  @IsOptional()
  @IsString()
  // En producción, validaríamos que sea una URL de nuestro bucket S3 confiable
  documentUrl?: string; 
}
