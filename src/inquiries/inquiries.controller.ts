import { Controller, Get, Post, Body, Param, UseGuards, Req, Patch } from '@nestjs/common';
import { InquiriesService } from './inquiries.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { InquiryStatus } from './entities/inquiry.entity';

@Controller('inquiries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Post()
  @Roles(UserRole.TENANT)
  async create(@Body() createInquiryDto: CreateInquiryDto, @Req() req: any) {
    return this.inquiriesService.create(createInquiryDto, req.user.userId);
  }

  @Get()
  @Roles(UserRole.TENANT)
  async findAll(@Req() req: any) {
    return this.inquiriesService.findAll(req.user.userId);
  }

  @Get(':id')
  @Roles(UserRole.TENANT)
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.inquiriesService.findOne(id, req.user.userId);
  }

  @Patch(':id/status')
  @Roles(UserRole.OWNER, UserRole.DALALI, UserRole.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: InquiryStatus,
    @Body('responseMessage') responseMessage?: string,
  ) {
    return this.inquiriesService.updateStatus(id, status, responseMessage);
  }

  @Patch(':id/read')
  @Roles(UserRole.TENANT)
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    return this.inquiriesService.markAsRead(id, req.user.userId);
  }

  @Get('property/:propertyId')
  @Roles(UserRole.OWNER, UserRole.DALALI, UserRole.ADMIN)
  async getPropertyInquiries(@Param('propertyId') propertyId: string, @Req() req: any) {
    return this.inquiriesService.getPropertyInquiries(propertyId, req.user.userId);
  }
} 