import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { BusinessService } from './business.service';
import { CreateBusinessProfileDto } from './dto/create-business.dto';
import { User } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Business Onboarding')
@UseGuards(JwtGuard)
@Controller('business')
export class BusinessController {
  constructor(private businessService: BusinessService) {}

  @Post('onboarding')
  @ApiOperation({ summary: 'Register a company (Roaster/Cafe) and request verification' })
  @ApiResponse({ status: 201, description: 'Application submitted successfully.' })
  @ApiResponse({ status: 409, description: 'RUT already exists or User already has a business.' })
  registerBusiness(@GetUser() user: User, @Body() dto: CreateBusinessProfileDto) {
    return this.businessService.onboardBusiness(user.id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user business profile status' })
  getMyBusiness(@GetUser() user: User) {
      return this.businessService.getMyBusiness(user.id);
  }
}
