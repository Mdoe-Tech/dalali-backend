import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      userId: Number(createNotificationDto.userId),
      data: createNotificationDto.data ? JSON.stringify(createNotificationDto.data) : null,
    });
    return this.notificationRepository.save(notification);
  }

  async findAll() {
    return this.notificationRepository.find();
  }

  async findOne(id: number) {
    return this.notificationRepository.findOne({ where: { id } });
  }

  async findByUser(userId: number) {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: number, updateNotificationDto: UpdateNotificationDto) {
    await this.notificationRepository.update(id, updateNotificationDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const notification = await this.findOne(id);
    if (notification) {
      await this.notificationRepository.remove(notification);
    }
    return { deleted: true };
  }

  async markAsRead(id: number) {
    await this.notificationRepository.update(id, { read: true });
    return this.findOne(id);
  }

  async markAllAsRead(userId: number) {
    await this.notificationRepository.update(
      { userId, read: false },
      { read: true },
    );
    return this.findByUser(userId);
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, read: false },
    });
  }

  // Helper method to create inquiry-related notifications
  async createInquiryNotification(data: {
    userId: string | number;
    inquiryId: string;
    type: NotificationType;
    message: string;
  }): Promise<Notification> {
    return this.create({
      userId: Number(data.userId),
      type: data.type,
      title: 'Inquiry Update',
      message: data.message,
      data: { inquiryId: data.inquiryId },
    });
  }
} 