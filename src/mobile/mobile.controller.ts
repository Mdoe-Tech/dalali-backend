import { Controller, Get, Post, UseGuards, Req, Body } from '@nestjs/common';
import { MobileService } from './mobile.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('mobile')
@ApiBearerAuth()
@Controller('mobile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MobileController {
  constructor(private readonly mobileService: MobileService) {}

  @Get('dashboard')
  @Roles(UserRole.OWNER, UserRole.TENANT, UserRole.DALALI)
  @ApiOperation({ summary: 'Get mobile dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getMobileDashboard(@Req() req: any) {
    return this.mobileService.getMobileDashboard(req.user.userId);
  }

  @Get('offline-data')
  @Roles(UserRole.OWNER, UserRole.TENANT, UserRole.DALALI)
  @ApiOperation({ summary: 'Get data for offline use' })
  @ApiResponse({ status: 200, description: 'Offline data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getOfflineData(@Req() req: any) {
    return this.mobileService.getOfflineData(req.user.userId);
  }

  @Post('sync')
  @Roles(UserRole.OWNER, UserRole.TENANT, UserRole.DALALI)
  @ApiOperation({ summary: 'Sync offline data with server' })
  @ApiResponse({ status: 200, description: 'Data synchronized successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async syncOfflineData(@Req() req: any, @Body() data: any) {
    return this.mobileService.syncOfflineData(req.user.userId, data);
  }
} 