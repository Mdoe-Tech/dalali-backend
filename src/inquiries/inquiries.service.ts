import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inquiry, InquiryStatus } from './entities/inquiry.entity';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { Property } from '../properties/entities/property.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class InquiriesService {
  constructor(
    @InjectRepository(Inquiry)
    private readonly inquiryRepository: Repository<Inquiry>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createInquiryDto: CreateInquiryDto, tenantId: string): Promise<Inquiry> {
    // First, verify the tenant exists and is a tenant
    const tenant = await this.userRepository.findOne({ 
      where: { 
        id: tenantId,
        role: UserRole.TENANT
      } 
    });
    
    if (!tenant) {
      throw new NotFoundException('Tenant not found or is not a tenant');
    }

    const property = await this.propertyRepository.findOne({ 
      where: { id: createInquiryDto.propertyId },
      relations: ['owner']
    });
    
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const inquiry = this.inquiryRepository.create({
      ...createInquiryDto,
      tenantId: tenant.id,
      tenant: { id: tenant.id },
      property: { id: property.id },
      status: InquiryStatus.PENDING,
    });

    const savedInquiry = await this.inquiryRepository.save(inquiry);
    
    // Create notification for property owner
    await this.notificationsService.create({
      userId: property.ownerId,
      type: NotificationType.INQUIRY_CREATED,
      title: 'New Inquiry',
      message: `New inquiry from ${tenant.firstName} ${tenant.lastName} about ${property.title}`,
      data: { inquiryId: savedInquiry.id }
    });

    // Create notification for tenant
    await this.notificationsService.create({
      userId: tenant.id,
      type: NotificationType.INQUIRY_CREATED,
      title: 'Inquiry Sent',
      message: `Your inquiry about ${property.title} has been sent`,
      data: { inquiryId: savedInquiry.id }
    });
    
    // Load the full relationships
    return this.inquiryRepository.findOne({
      where: { id: savedInquiry.id },
      relations: ['property', 'tenant'],
    });
  }

  async findAll(tenantId: string): Promise<Inquiry[]> {
    return this.inquiryRepository.find({
      where: { tenantId },
      relations: ['property', 'tenant'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Inquiry> {
    console.log('Looking for inquiry with ID:', id);
    console.log('Current tenant ID:', tenantId);
    
    const inquiry = await this.inquiryRepository.findOne({
      where: { id },
      relations: ['property', 'tenant'],
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    console.log('Found inquiry tenant ID:', inquiry.tenantId);
    console.log('Inquiry tenant:', inquiry.tenant);

    // Simple check - if the inquiry's tenantId matches the current user's ID
    if (inquiry.tenantId !== tenantId) {
      throw new ForbiddenException('You can only view your own inquiries');
    }

    return inquiry;
  }

  async updateStatus(id: string, status: InquiryStatus, responseMessage?: string): Promise<Inquiry> {
    const inquiry = await this.inquiryRepository.findOne({ where: { id } });
    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    inquiry.status = status;
    if (responseMessage) {
      inquiry.responseMessage = responseMessage;
    }
    inquiry.isRead = false;

    return this.inquiryRepository.save(inquiry);
  }

  async markAsRead(id: string, tenantId: string): Promise<Inquiry> {
    const inquiry = await this.findOne(id, tenantId);
    inquiry.isRead = true;
    return this.inquiryRepository.save(inquiry);
  }

  async getPropertyInquiries(propertyId: string, ownerId: string): Promise<Inquiry[]> {
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId, ownerId },
    });

    if (!property) {
      throw new NotFoundException('Property not found or you are not the owner');
    }

    return this.inquiryRepository.find({
      where: { propertyId },
      relations: ['tenant'],
      order: { createdAt: 'DESC' },
    });
  }
} 