import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Patch,
  Delete,
} from '@nestjs/common';
import { PropertyViewingsService } from './property-viewings.service';
import { ScheduleViewingDto } from './dto/schedule-viewing.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@Controller('properties/:propertyId/viewings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PropertyViewingsController {
  constructor(private readonly viewingsService: PropertyViewingsService) {}

  @Post()
  @Roles(UserRole.TENANT)
  async scheduleViewing(
    @Param('propertyId') propertyId: string,
    @Body() scheduleDto: ScheduleViewingDto,
    @Req() req: any,
  ) {
    return this.viewingsService.scheduleViewing(
      propertyId,
      req.user.userId,
      scheduleDto,
    );
  }

  @Get()
  @Roles(UserRole.TENANT, UserRole.OWNER, UserRole.DALALI)
  async getPropertyViewings(
    @Param('propertyId') propertyId: string,
    @Req() req: any,
  ) {
    return this.viewingsService.getPropertyViewings(propertyId);
  }

  @Get('upcoming')
  @Roles(UserRole.TENANT, UserRole.OWNER, UserRole.DALALI)
  async getUpcomingViewings(@Req() req: any) {
    return this.viewingsService.getUpcomingViewings(req.user.userId);
  }

  @Patch(':id/confirm')
  @Roles(UserRole.OWNER, UserRole.DALALI)
  async confirmViewing(
    @Param('id') viewingId: string,
    @Req() req: any,
  ) {
    return this.viewingsService.confirmViewing(viewingId, req.user.userId);
  }

  @Delete(':id')
  @Roles(UserRole.TENANT, UserRole.OWNER, UserRole.DALALI)
  async cancelViewing(
    @Param('id') viewingId: string,
    @Body('reason') reason: string,
    @Req() req: any,
  ) {
    return this.viewingsService.cancelViewing(viewingId, req.user.userId, reason);
  }
} 