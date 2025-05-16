import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Payment, PaymentStatus, PaymentType } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { User } from '../users/entities/user.entity';
import { Property } from '../properties/entities/property.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createPayment(userId: string, createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const [payer, payee] = await Promise.all([
      this.userRepository.findOne({ where: { id: userId } }),
      this.userRepository.findOne({ where: { id: createPaymentDto.payeeId } }),
    ]);

    if (!payer || !payee) {
      throw new NotFoundException('User not found');
    }

    if (createPaymentDto.propertyId) {
      const property = await this.propertyRepository.findOne({
        where: { id: createPaymentDto.propertyId },
      });
      if (!property) {
        throw new NotFoundException('Property not found');
      }
    }

    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      payerId: userId,
      status: PaymentStatus.PENDING,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Notify payee about new payment
    await this.notificationsService.create({
      userId: Number(createPaymentDto.payeeId),
      type: NotificationType.PAYMENT_RECEIVED,
      title: 'Payment Received',
      message: `You have received a payment of ${createPaymentDto.amount}`,
      data: { paymentId: savedPayment.id },
    });

    return savedPayment;
  }

  async confirmPayment(paymentId: string, userId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['payee', 'payer'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.payeeId !== userId) {
      throw new BadRequestException('You can only confirm payments received by you');
    }

    payment.status = PaymentStatus.COMPLETED;
    payment.paidAt = new Date();

    const savedPayment = await this.paymentRepository.save(payment);

    // Notify payer about payment confirmation
    await this.notificationsService.create({
      userId: payment.payerId,
      type: NotificationType.PAYMENT_CONFIRMED,
      title: 'Payment Confirmed',
      message: `Your payment of ${payment.amount} has been confirmed`,
      data: { paymentId: savedPayment.id },
    });

    return savedPayment;
  }

  async getPayment(paymentId: string, userId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['payer', 'payee', 'property'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.payerId !== userId && payment.payeeId !== userId) {
      throw new BadRequestException('You do not have permission to view this payment');
    }

    return payment;
  }

  async getUserPayments(userId: string, type?: 'sent' | 'received'): Promise<Payment[]> {
    const where = type === 'sent' 
      ? { payerId: userId }
      : type === 'received'
        ? { payeeId: userId }
        : [
            { payerId: userId },
            { payeeId: userId },
          ];

    return this.paymentRepository.find({
      where,
      relations: ['payer', 'payee', 'property'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPropertyPayments(propertyId: string, userId: string): Promise<Payment[]> {
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.ownerId !== userId) {
      throw new BadRequestException('You do not have permission to view these payments');
    }

    return this.paymentRepository.find({
      where: { propertyId },
      relations: ['payer', 'payee'],
      order: { createdAt: 'DESC' },
    });
  }

  async calculateCommission(propertyId: string): Promise<number> {
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Calculate 5% commission
    return property.price * 0.05;
  }

  async getPaymentStats(userId: string, timeRange: 'day' | 'week' | 'month' = 'month'): Promise<any> {
    const dateRange = this.getDateRange(timeRange);
    const payments = await this.paymentRepository.find({
      where: {
        payeeId: userId,
        status: PaymentStatus.COMPLETED,
        paidAt: Between(dateRange.start, dateRange.end),
      },
    });

    const totalReceived = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const totalSent = await this.paymentRepository.find({
      where: {
        payerId: userId,
        status: PaymentStatus.COMPLETED,
        paidAt: Between(dateRange.start, dateRange.end),
      },
    }).then(payments => payments.reduce((sum, payment) => sum + Number(payment.amount), 0));

    return {
      timeRange,
      totalReceived,
      totalSent,
      netAmount: totalReceived - totalSent,
      transactionCount: payments.length,
    };
  }

  private getDateRange(timeRange: 'day' | 'week' | 'month'): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (timeRange) {
      case 'day':
        start.setDate(end.getDate() - 1);
        break;
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
    }

    return { start, end };
  }
} 