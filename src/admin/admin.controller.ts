import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, Patch, Delete } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { PropertyStatus } from '../properties/entities/property.entity';
import { Review } from '../reviews/entities/review.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: UserRole,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers({ page, limit, role, search });
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
  ) {
    return this.adminService.updateUserRole(id, role);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('properties')
  async getProperties(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: PropertyStatus,
    @Query('search') search?: string,
  ) {
    return this.adminService.getProperties({ page, limit, status, search });
  }

  @Get('properties/:id')
  async getProperty(@Param('id') id: string) {
    return this.adminService.getProperty(id);
  }

  @Patch('properties/:id/status')
  async updatePropertyStatus(
    @Param('id') id: string,
    @Body('status') status: PropertyStatus,
  ) {
    return this.adminService.updatePropertyStatus(id, status);
  }

  @Delete('properties/:id')
  async deleteProperty(@Param('id') id: string) {
    return this.adminService.deleteProperty(id);
  }

  @Get('reviews')
  async getReviews(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: 'property' | 'user',
    @Query('search') search?: string,
  ) {
    return this.adminService.getReviews({ page, limit, type, search });
  }

  @Get('reviews/:id')
  async getReview(@Param('id') id: string) {
    return this.adminService.getReview(id);
  }

  @Delete('reviews/:id')
  async deleteReview(@Param('id') id: string) {
    return this.adminService.deleteReview(id);
  }

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('reports')
  async getReports(
    @Query('type') type?: 'user' | 'property' | 'review',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getReports({ type, page, limit });
  }

  @Post('reports/:id/resolve')
  async resolveReport(
    @Param('id') id: string,
    @Body('action') action: 'warn' | 'suspend' | 'delete',
  ) {
    return this.adminService.resolveReport(id, action);
  }
} 