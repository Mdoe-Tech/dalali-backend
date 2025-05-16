import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { DalaliService } from './dalali.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@Controller('dalali')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DALALI)
export class DalaliController {
  constructor(private readonly dalaliService: DalaliService) {}

  @Get('properties')
  async getProperties(@Req() req: any) {
    return this.dalaliService.getDalaliProperties(req.user.userId);
  }

  @Get('properties/:id/commission')
  async calculateCommission(@Param('id') propertyId: string) {
    return this.dalaliService.calculateCommission(propertyId);
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    return this.dalaliService.getDalaliStats(req.user.userId);
  }
} 