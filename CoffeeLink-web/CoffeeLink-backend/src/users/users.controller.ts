import { Controller, Get, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';

@ApiTags('Users')
@UseGuards(JwtGuard)
@Controller('users')
export class UsersController {
  
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiCookieAuth('Authentication')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Returns the logged in user profile.' })
  getMe(@GetUser() user: User) {
    return user;
  }
}
