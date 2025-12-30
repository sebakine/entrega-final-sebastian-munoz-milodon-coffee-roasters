import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from './guards/admin.guard';
import { AdminService } from './admin.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Admin Dashboard')
@UseGuards(JwtGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('business/pending')
  getPending() {
    return this.adminService.getPendingBusinesses();
  }

  @Patch('business/:id/approve')
  approve(@Param('id') id: string) {
    return this.adminService.approveBusiness(id);
  }

  @Patch('business/:id/reject')
  reject(@Param('id') id: string, @Body('reason') reason: string) {
    return this.adminService.rejectBusiness(id, reason);
  }
}
