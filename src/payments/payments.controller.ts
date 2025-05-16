import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles(UserRole.TENANT, UserRole.OWNER, UserRole.DALALI)
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req: any,
  ) {
    return this.paymentsService.createPayment(req.user.userId, createPaymentDto);
  }

  @Patch(':id/confirm')
  @Roles(UserRole.OWNER, UserRole.DALALI)
  async confirmPayment(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.paymentsService.confirmPayment(id, req.user.userId);
  }

  @Get(':id')
  @Roles(UserRole.TENANT, UserRole.OWNER, UserRole.DALALI)
  async getPayment(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.paymentsService.getPayment(id, req.user.userId);
  }

  @Get('user/me')
  @Roles(UserRole.TENANT, UserRole.OWNER, UserRole.DALALI)
  async getUserPayments(
    @Req() req: any,
    @Query('type') type?: 'sent' | 'received',
  ) {
    return this.paymentsService.getUserPayments(req.user.userId, type);
  }

  @Get('property/:propertyId')
  @Roles(UserRole.OWNER, UserRole.DALALI)
  async getPropertyPayments(
    @Param('propertyId') propertyId: string,
    @Req() req: any,
  ) {
    return this.paymentsService.getPropertyPayments(propertyId, req.user.userId);
  }

  @Get('property/:propertyId/commission')
  @Roles(UserRole.DALALI)
  async calculateCommission(
    @Param('propertyId') propertyId: string,
  ) {
    return this.paymentsService.calculateCommission(propertyId);
  }

  @Get('stats')
  @Roles(UserRole.TENANT, UserRole.OWNER, UserRole.DALALI)
  async getPaymentStats(
    @Query('timeRange') timeRange: 'day' | 'week' | 'month' = 'month',
    @Req() req: any,
  ) {
    return this.paymentsService.getPaymentStats(req.user.userId, timeRange);
  }
} 