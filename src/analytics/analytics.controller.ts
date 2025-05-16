import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('owner/dashboard')
  @Roles(UserRole.OWNER)
  async getOwnerDashboard(@Req() req: any) {
    return this.analyticsService.getOwnerDashboard(req.user.userId);
  }

  @Get('tenant/dashboard')
  @Roles(UserRole.TENANT)
  async getTenantDashboard(@Req() req: any) {
    return this.analyticsService.getTenantDashboard(req.user.userId);
  }

  @Get('dalali/dashboard')
  @Roles(UserRole.DALALI)
  async getDalaliDashboard(@Req() req: any) {
    return this.analyticsService.getDalaliDashboard(req.user.userId);
  }

  @Get('property/performance')
  @Roles(UserRole.OWNER, UserRole.DALALI)
  async getPropertyPerformance(
    @Req() req: any,
    @Query('timeRange') timeRange: 'day' | 'week' | 'month' = 'month'
  ) {
    return this.analyticsService.getPropertyPerformance(req.user.userId, timeRange);
  }

  @Get('inquiry/trends')
  @Roles(UserRole.OWNER, UserRole.DALALI)
  async getInquiryTrends(
    @Req() req: any,
    @Query('timeRange') timeRange: 'day' | 'week' | 'month' = 'month'
  ) {
    return this.analyticsService.getInquiryTrends(req.user.userId, timeRange);
  }

  @Get('user/activity')
  @Roles(UserRole.OWNER, UserRole.TENANT, UserRole.DALALI)
  async getUserActivity(
    @Req() req: any,
    @Query('timeRange') timeRange: 'day' | 'week' | 'month' = 'month'
  ) {
    return this.analyticsService.getUserActivity(req.user.userId, timeRange);
  }

  @Get('revenue')
  @Roles(UserRole.OWNER, UserRole.DALALI)
  async getRevenueAnalytics(
    @Req() req: any,
    @Query('timeRange') timeRange: 'day' | 'week' | 'month' = 'month'
  ) {
    return this.analyticsService.getRevenueAnalytics(req.user.userId, timeRange);
  }
} 