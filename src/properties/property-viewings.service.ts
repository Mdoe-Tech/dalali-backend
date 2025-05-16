import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PropertyViewing, ViewingStatus } from './entities/property-viewing.entity';
import { Property } from './entities/property.entity';
import { User } from '../users/entities/user.entity';
import { ScheduleViewingDto } from './dto/schedule-viewing.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class PropertyViewingsService {
  constructor(
    @InjectRepository(PropertyViewing)
    private readonly viewingRepository: Repository<PropertyViewing>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async scheduleViewing(
    propertyId: string,
    tenantId: string,
    scheduleDto: ScheduleViewingDto,
  ): Promise<PropertyViewing> {
    const [property, tenant] = await Promise.all([
      this.propertyRepository.findOne({ where: { id: propertyId } }),
      this.userRepository.findOne({ where: { id: tenantId } }),
    ]);

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check for scheduling conflicts
    const hasConflict = await this.checkSchedulingConflict(
      propertyId,
      scheduleDto.scheduledDate,
      scheduleDto.duration,
    );

    if (hasConflict) {
      throw new BadRequestException('There is a scheduling conflict for this time slot');
    }

    const viewing = this.viewingRepository.create({
      propertyId,
      tenantId,
      scheduledDate: scheduleDto.scheduledDate,
      duration: scheduleDto.duration,
      notes: scheduleDto.notes,
      status: ViewingStatus.PENDING,
    });

    const savedViewing = await this.viewingRepository.save(viewing);

    // Notify property owner
    await this.notificationsService.create({
      userId: property.ownerId,
      type: NotificationType.PROPERTY_VIEWED,
      title: 'New Viewing Request',
      message: `New viewing request from ${tenant.firstName} ${tenant.lastName} for ${property.title}`,
      data: { viewingId: savedViewing.id },
    });

    return savedViewing;
  }

  async confirmViewing(viewingId: string, ownerId: string): Promise<PropertyViewing> {
    const viewing = await this.viewingRepository.findOne({
      where: { id: viewingId },
      relations: ['property', 'tenant'],
    });

    if (!viewing) {
      throw new NotFoundException('Viewing not found');
    }

    if (viewing.property.ownerId !== ownerId) {
      throw new BadRequestException('You are not authorized to confirm this viewing');
    }

    viewing.status = ViewingStatus.CONFIRMED;
    viewing.isConfirmed = true;

    const savedViewing = await this.viewingRepository.save(viewing);

    // Notify tenant
    await this.notificationsService.create({
      userId: viewing.tenantId,
      type: NotificationType.PROPERTY_VIEWED,
      title: 'Viewing Confirmed',
      message: `Your viewing request for ${viewing.property.title} has been confirmed`,
      data: { viewingId: savedViewing.id },
    });

    return savedViewing;
  }

  async cancelViewing(
    viewingId: string,
    userId: string,
    reason?: string,
  ): Promise<PropertyViewing> {
    const viewing = await this.viewingRepository.findOne({
      where: { id: viewingId },
      relations: ['property', 'tenant'],
    });

    if (!viewing) {
      throw new NotFoundException('Viewing not found');
    }

    if (viewing.tenantId !== userId && viewing.property.ownerId !== userId) {
      throw new BadRequestException('You are not authorized to cancel this viewing');
    }

    viewing.status = ViewingStatus.CANCELLED;
    viewing.cancellationReason = reason;

    const savedViewing = await this.viewingRepository.save(viewing);

    // Notify the other party
    const notifyUserId = viewing.tenantId === userId ? viewing.property.ownerId : viewing.tenantId;
    await this.notificationsService.create({
      userId: notifyUserId,
      type: NotificationType.PROPERTY_VIEWED,
      title: 'Viewing Cancelled',
      message: `A viewing for ${viewing.property.title} has been cancelled`,
      data: { viewingId: savedViewing.id },
    });

    return savedViewing;
  }

  async getPropertyViewings(propertyId: string): Promise<PropertyViewing[]> {
    return this.viewingRepository.find({
      where: { propertyId },
      relations: ['tenant'],
      order: { scheduledDate: 'ASC' },
    });
  }

  async getTenantViewings(tenantId: string): Promise<PropertyViewing[]> {
    return this.viewingRepository.find({
      where: { tenantId },
      relations: ['property'],
      order: { scheduledDate: 'ASC' },
    });
  }

  async getUpcomingViewings(userId: string): Promise<PropertyViewing[]> {
    const now = new Date();
    return this.viewingRepository.find({
      where: [
        { tenantId: userId, status: ViewingStatus.CONFIRMED, scheduledDate: Between(now, new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) },
        { property: { ownerId: userId }, status: ViewingStatus.CONFIRMED, scheduledDate: Between(now, new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) },
      ],
      relations: ['property', 'tenant'],
      order: { scheduledDate: 'ASC' },
    });
  }

  private async checkSchedulingConflict(
    propertyId: string,
    scheduledDate: Date,
    duration: number,
  ): Promise<boolean> {
    const endTime = new Date(scheduledDate.getTime() + duration * 60 * 1000);
    const startTime = new Date(scheduledDate.getTime() - duration * 60 * 1000);

    const conflictingViewings = await this.viewingRepository.find({
      where: {
        propertyId,
        status: ViewingStatus.CONFIRMED,
        scheduledDate: Between(startTime, endTime),
      },
    });

    return conflictingViewings.length > 0;
  }
} 