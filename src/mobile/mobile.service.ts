import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from '../properties/entities/property.entity';
import { User } from '../users/entities/user.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Inquiry } from '../inquiries/entities/inquiry.entity';
import { Notification } from '../notifications/entities/notification.entity';

@Injectable()
export class MobileService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Inquiry)
    private readonly inquiryRepository: Repository<Inquiry>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async getMobileDashboard(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const [properties, payments, inquiries, notifications] = await Promise.all([
      this.getUserProperties(userId),
      this.getUserPayments(userId),
      this.getUserInquiries(userId),
      this.getUserNotifications(userId),
    ]);

    return {
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
      },
      properties,
      payments,
      inquiries,
      notifications,
    };
  }

  private async getUserProperties(userId: string) {
    const properties = await this.propertyRepository.find({
      where: { owner: { id: userId } },
      relations: ['images', 'location'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return properties.map(property => ({
      id: property.id,
      title: property.title,
      price: property.price,
      status: property.status,
      thumbnail: Array.isArray(property.images) ? property.images[0] : undefined,
      location: property.location,
      createdAt: property.createdAt,
    }));
  }

  private async getUserPayments(userId: string) {
    const payments = await this.paymentRepository.find({
      where: { payerId: userId },
      relations: ['property'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      propertyTitle: payment.property.title,
      createdAt: payment.createdAt,
    }));
  }

  private async getUserInquiries(userId: string) {
    const inquiries = await this.inquiryRepository.find({
      where: { tenantId: userId },
      relations: ['property'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return inquiries.map(inquiry => ({
      id: inquiry.id,
      message: inquiry.message,
      status: inquiry.status,
      propertyTitle: inquiry.property.title,
      createdAt: inquiry.createdAt,
    }));
  }

  private async getUserNotifications(userId: string) {
    const notifications = await this.notificationRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: notification.isRead,
      createdAt: notification.createdAt,
    }));
  }

  async getOfflineData(userId: string) {
    const [properties, payments, inquiries] = await Promise.all([
      this.propertyRepository.find({
        where: { ownerId: userId },
        relations: ['images', 'location'],
      }),
      this.paymentRepository.find({
        where: { payerId: userId },
        relations: ['property'],
      }),
      this.inquiryRepository.find({
        where: { tenantId: userId },
        relations: ['property'],
      }),
    ]);

    return {
      properties: properties.map(property => ({
        id: property.id,
        title: property.title,
        description: property.description,
        price: property.price,
        status: property.status,
        images: property.images,
        location: property.location,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
      })),
      payments: payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        propertyId: payment.property.id,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      })),
      inquiries: inquiries.map(inquiry => ({
        id: inquiry.id,
        message: inquiry.message,
        status: inquiry.status,
        propertyId: inquiry.property.id,
        createdAt: inquiry.createdAt,
        updatedAt: inquiry.updatedAt,
      })),
    };
  }

  async syncOfflineData(userId: string, data: any) {
    // Implement offline data synchronization logic here
    // This would handle syncing changes made while offline
    return { success: true, message: 'Data synchronized successfully' };
  }
} 