import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Property, PropertyStatus } from '../properties/entities/property.entity';
import { Inquiry, InquiryStatus } from '../inquiries/entities/inquiry.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { SavedSearch } from '../properties/entities/saved-search.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { PropertyViewsService } from '../properties/property-views.service';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(Inquiry)
    private readonly inquiryRepository: Repository<Inquiry>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SavedSearch)
    private readonly savedSearchRepository: Repository<SavedSearch>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly propertyViewsService: PropertyViewsService,
  ) {}

  async getOwnerDashboard(userId: string) {
    const [properties, inquiries, notifications] = await Promise.all([
      this.getOwnerProperties(userId),
      this.getOwnerInquiries(userId),
      this.getOwnerNotifications(userId),
    ]);

    return {
      properties,
      inquiries,
      notifications,
      summary: {
        totalProperties: properties.total,
        activeProperties: properties.active,
        totalInquiries: inquiries.total,
        pendingInquiries: inquiries.pending,
        unreadNotifications: notifications.unread,
      },
    };
  }

  async getTenantDashboard(userId: string) {
    const [inquiries, savedSearches, notifications] = await Promise.all([
      this.getTenantInquiries(userId),
      this.getTenantSavedSearches(userId),
      this.getTenantNotifications(userId),
    ]);

    return {
      inquiries,
      savedSearches,
      notifications,
      summary: {
        totalInquiries: inquiries.total,
        activeSearches: savedSearches.active,
        unreadNotifications: notifications.unread,
      },
    };
  }

  async getDalaliDashboard(userId: string) {
    const [properties, inquiries, notifications] = await Promise.all([
      this.getDalaliProperties(userId),
      this.getDalaliInquiries(userId),
      this.getDalaliNotifications(userId),
    ]);

    return {
      properties,
      inquiries,
      notifications,
      summary: {
        totalProperties: properties.total,
        activeProperties: properties.active,
        totalInquiries: inquiries.total,
        pendingInquiries: inquiries.pending,
        unreadNotifications: notifications.unread,
      },
    };
  }

  async getRevenueAnalytics(userId: string, timeRange: 'day' | 'week' | 'month' = 'month') {
    const dateRange = this.getDateRange(timeRange);
    const properties = await this.propertyRepository.find({
      where: { ownerId: userId },
      relations: ['inquiries'],
    });

    const revenueData = properties.map(property => {
      const inquiriesInRange = property.inquiries.filter(inquiry => 
        inquiry.createdAt >= dateRange.start && 
        inquiry.createdAt <= dateRange.end &&
        inquiry.status === InquiryStatus.ACCEPTED
      );

      const totalRevenue = inquiriesInRange.reduce((sum, inquiry) => sum + property.price, 0);
      const commission = totalRevenue * 0.05; // 5% commission for dalali agents

      return {
        propertyId: property.id,
        propertyTitle: property.title,
        totalRevenue,
        commission,
        netRevenue: totalRevenue - commission,
        inquiries: inquiriesInRange.length,
      };
    });

    const totalRevenue = revenueData.reduce((sum, data) => sum + data.totalRevenue, 0);
    const totalCommission = revenueData.reduce((sum, data) => sum + data.commission, 0);
    const netRevenue = totalRevenue - totalCommission;

    return {
      timeRange,
      summary: {
        totalRevenue,
        totalCommission,
        netRevenue,
        totalProperties: properties.length,
        totalInquiries: revenueData.reduce((sum, data) => sum + data.inquiries, 0),
      },
      properties: revenueData,
    };
  }

  async getPropertyPerformance(userId: string, timeRange: 'day' | 'week' | 'month' = 'month') {
    const dateRange = this.getDateRange(timeRange);
    const properties = await this.propertyRepository.find({
      where: { ownerId: userId },
      relations: ['inquiries'],
    });

    const propertyIds = properties.map(p => p.id);
    const viewsData = await this.propertyViewsService.getViewsByProperty(propertyIds, timeRange);

    const performance = properties.map(property => {
      const inquiriesInRange = property.inquiries.filter(inquiry => 
        inquiry.createdAt >= dateRange.start && inquiry.createdAt <= dateRange.end
      );

      const propertyViews = viewsData.find(v => v.propertyId === property.id);
      const views = propertyViews?.totalViews || 0;
      const uniqueViewers = propertyViews?.uniqueViewers || 0;
      
      const inquiryRate = views > 0 ? (inquiriesInRange.length / views) * 100 : 0;
      const conversionRate = inquiriesInRange.length > 0 
        ? (inquiriesInRange.filter(i => i.status === InquiryStatus.ACCEPTED).length / inquiriesInRange.length) * 100 
        : 0;

      return {
        id: property.id,
        title: property.title,
        views,
        uniqueViewers,
        inquiries: inquiriesInRange.length,
        inquiryRate,
        conversionRate,
        status: property.status,
        price: property.price,
      };
    });

    return {
      timeRange,
      totalProperties: properties.length,
      averageInquiryRate: performance.reduce((sum, p) => sum + p.inquiryRate, 0) / properties.length,
      averageConversionRate: performance.reduce((sum, p) => sum + p.conversionRate, 0) / properties.length,
      properties: performance,
    };
  }

  async getInquiryTrends(userId: string, timeRange: 'day' | 'week' | 'month' = 'month') {
    const dateRange = this.getDateRange(timeRange);
    const properties = await this.propertyRepository.find({
      where: { ownerId: userId },
      select: ['id'],
    });

    const propertyIds = properties.map(p => p.id);
    const inquiries = await this.inquiryRepository.find({
      where: {
        propertyId: In(propertyIds),
        createdAt: Between(dateRange.start, dateRange.end),
      },
      order: { createdAt: 'ASC' },
    });

    const trends = this.groupByTimeRange(inquiries, timeRange);
    const statusDistribution = this.getStatusDistribution(inquiries);

    return {
      timeRange,
      totalInquiries: inquiries.length,
      trends,
      statusDistribution,
    };
  }

  async getUserActivity(userId: string, timeRange: 'day' | 'week' | 'month' = 'month') {
    const dateRange = this.getDateRange(timeRange);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    const [properties, inquiries, notifications] = await Promise.all([
      this.propertyRepository.find({
        where: {
          ownerId: userId,
          createdAt: Between(dateRange.start, dateRange.end),
        },
      }),
      this.inquiryRepository.find({
        where: {
          tenantId: userId,
          createdAt: Between(dateRange.start, dateRange.end),
        },
      }),
      this.notificationRepository.find({
        where: {
          userId,
          createdAt: Between(dateRange.start, dateRange.end),
        },
      }),
    ]);

    return {
      timeRange,
      role: user.role,
      activity: {
        propertiesListed: properties.length,
        inquiriesMade: inquiries.length,
        notificationsReceived: notifications.length,
      },
      timeline: this.groupByTimeRange(
        [...properties, ...inquiries, ...notifications].sort((a, b) => 
          a.createdAt.getTime() - b.createdAt.getTime()
        ),
        timeRange
      ),
    };
  }

  async generateFinancialReport(userId: string, timeRange: 'day' | 'week' | 'month' | 'year' = 'month') {
    const dateRange = this.getDateRange(timeRange);
    const [payments, properties] = await Promise.all([
      this.paymentRepository.find({
        where: {
          payeeId: userId,
          status: PaymentStatus.COMPLETED,
          paidAt: Between(dateRange.start, dateRange.end),
        },
      }),
      this.propertyRepository.find({
        where: { ownerId: userId },
      }),
    ]);

    const propertyIds = properties.map(p => p.id);
    const propertyPayments = payments.filter(p => propertyIds.includes(p.propertyId));

    const report = {
      timeRange,
      summary: {
        totalRevenue: propertyPayments.reduce((sum, p) => sum + Number(p.amount), 0),
        totalProperties: properties.length,
        averageRevenuePerProperty: 0,
        paymentDistribution: this.getPaymentDistribution(propertyPayments),
      },
      properties: await Promise.all(properties.map(async property => {
        const propertyPayments = payments.filter(p => p.propertyId === property.id);
        return {
          id: property.id,
          title: property.title,
          revenue: propertyPayments.reduce((sum, p) => sum + Number(p.amount), 0),
          paymentCount: propertyPayments.length,
          status: property.status,
        };
      })),
    };

    report.summary.averageRevenuePerProperty = report.summary.totalRevenue / (report.summary.totalProperties || 1);
    return report;
  }

  async generateOccupancyReport(userId: string, timeRange: 'day' | 'week' | 'month' | 'year' = 'month') {
    const dateRange = this.getDateRange(timeRange);
    const properties = await this.propertyRepository.find({
      where: { ownerId: userId },
      relations: ['inquiries'],
    });

    const report = {
      timeRange,
      summary: {
        totalProperties: properties.length,
        occupiedProperties: properties.filter(p => p.status === PropertyStatus.RENTED).length,
        occupancyRate: 0,
        averageOccupancyDuration: 0,
      },
      properties: properties.map(property => ({
        id: property.id,
        title: property.title,
        status: property.status,
        occupancyHistory: this.getOccupancyHistory(property, dateRange),
      })),
    };

    report.summary.occupancyRate = (report.summary.occupiedProperties / report.summary.totalProperties) * 100;
    return report;
  }

  async generateMaintenanceReport(userId: string, timeRange: 'day' | 'week' | 'month' | 'year' = 'month') {
    // This would typically integrate with a maintenance request system
    // For now, return a placeholder structure
    return {
      timeRange,
      summary: {
        totalRequests: 0,
        pendingRequests: 0,
        completedRequests: 0,
        averageResolutionTime: 0,
      },
      requests: [],
    };
  }

  async generateUserActivityReport(userId: string, timeRange: 'day' | 'week' | 'month' | 'year' = 'month') {
    const dateRange = this.getDateRange(timeRange);
    const [properties, inquiries, notifications, savedSearches] = await Promise.all([
      this.propertyRepository.find({
        where: {
          ownerId: userId,
          createdAt: Between(dateRange.start, dateRange.end),
        },
      }),
      this.inquiryRepository.find({
        where: {
          tenantId: userId,
          createdAt: Between(dateRange.start, dateRange.end),
        },
      }),
      this.notificationRepository.find({
        where: {
          userId,
          createdAt: Between(dateRange.start, dateRange.end),
        },
      }),
      this.savedSearchRepository.find({
        where: {
          userId,
          createdAt: Between(dateRange.start, dateRange.end),
        },
      }),
    ]);

    return {
      timeRange,
      summary: {
        propertiesListed: properties.length,
        inquiriesMade: inquiries.length,
        notificationsReceived: notifications.length,
        savedSearches: savedSearches.length,
      },
      activity: {
        properties: properties.map(p => ({
          id: p.id,
          title: p.title,
          status: p.status,
          createdAt: p.createdAt,
        })),
        inquiries: inquiries.map(i => ({
          id: i.id,
          propertyId: i.propertyId,
          status: i.status,
          createdAt: i.createdAt,
        })),
        notifications: notifications.map(n => ({
          id: n.id,
          type: n.type,
          isRead: n.isRead,
          createdAt: n.createdAt,
        })),
        savedSearches: savedSearches.map(s => ({
          id: s.id,
          name: s.name,
          isActive: s.isActive,
          createdAt: s.createdAt,
        })),
      },
    };
  }

  async generateMarketTrendReport(timeRange: 'day' | 'week' | 'month' | 'year' = 'month') {
    const dateRange = this.getDateRange(timeRange);
    const properties = await this.propertyRepository.find({
      where: {
        createdAt: Between(dateRange.start, dateRange.end),
      },
    });

    const report = {
      timeRange,
      summary: {
        totalProperties: properties.length,
        averagePrice: 0,
        priceRange: {
          min: 0,
          max: 0,
        },
        propertyTypeDistribution: this.getPropertyTypeDistribution(properties),
      },
      trends: {
        priceTrend: this.getPriceTrend(properties, timeRange),
        occupancyTrend: this.getOccupancyTrend(properties, timeRange),
      },
    };

    const prices = properties.map(p => Number(p.price));
    report.summary.averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    report.summary.priceRange.min = Math.min(...prices);
    report.summary.priceRange.max = Math.max(...prices);

    return report;
  }

  private getDateRange(timeRange: 'day' | 'week' | 'month' | 'year'): { start: Date; end: Date } {
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
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }

    return { start, end };
  }

  private groupByTimeRange(items: any[], timeRange: 'day' | 'week' | 'month'): any[] {
    const groups = new Map<string, number>();
    const format = timeRange === 'day' ? 'HH:mm' : timeRange === 'week' ? 'dd/MM' : 'MM/YYYY';

    items.forEach(item => {
      const date = new Date(item.createdAt);
      const key = this.formatDate(date, format);
      groups.set(key, (groups.get(key) || 0) + 1);
    });

    return Array.from(groups.entries()).map(([time, count]) => ({ time, count }));
  }

  private getStatusDistribution(inquiries: Inquiry[]): Record<InquiryStatus, number> {
    return inquiries.reduce((acc, inquiry) => {
      acc[inquiry.status] = (acc[inquiry.status] || 0) + 1;
      return acc;
    }, {} as Record<InquiryStatus, number>);
  }

  private formatDate(date: Date, format: string): string {
    const pad = (num: number) => num.toString().padStart(2, '0');
    
    return format
      .replace('HH', pad(date.getHours()))
      .replace('mm', pad(date.getMinutes()))
      .replace('dd', pad(date.getDate()))
      .replace('MM', pad(date.getMonth() + 1))
      .replace('YYYY', date.getFullYear().toString());
  }

  private async getOwnerProperties(userId: string) {
    const [properties, total] = await this.propertyRepository.findAndCount({
      where: { ownerId: userId },
      relations: ['inquiries'],
    });

    const active = properties.filter(p => p.status === PropertyStatus.AVAILABLE).length;

    return {
      total,
      active,
      properties: properties.map(p => ({
        id: p.id,
        title: p.title,
        status: p.status,
        price: p.price,
        inquiries: p.inquiries?.length || 0,
      })),
    };
  }

  private async getOwnerInquiries(userId: string) {
    const properties = await this.propertyRepository.find({
      where: { ownerId: userId },
      select: ['id'],
    });

    const propertyIds = properties.map(p => p.id);
    const [inquiries, total] = await this.inquiryRepository.findAndCount({
      where: { propertyId: In(propertyIds) },
      relations: ['tenant', 'property'],
    });

    const pending = inquiries.filter(i => i.status === InquiryStatus.PENDING).length;

    return {
      total,
      pending,
      inquiries: inquiries.map(i => ({
        id: i.id,
        propertyTitle: i.property.title,
        tenantName: `${i.tenant.firstName} ${i.tenant.lastName}`,
        status: i.status,
        createdAt: i.createdAt,
      })),
    };
  }

  private async getOwnerNotifications(userId: string) {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const unread = notifications.filter(n => !n.isRead).length;

    return {
      total,
      unread,
      notifications: notifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
    };
  }

  private async getTenantInquiries(userId: string) {
    const [inquiries, total] = await this.inquiryRepository.findAndCount({
      where: { tenantId: userId },
      relations: ['property'],
      order: { createdAt: 'DESC' },
    });

    const pending = inquiries.filter(i => i.status === InquiryStatus.PENDING).length;

    return {
      total,
      pending,
      inquiries: inquiries.map(i => ({
        id: i.id,
        propertyTitle: i.property.title,
        status: i.status,
        createdAt: i.createdAt,
      })),
    };
  }

  private async getTenantSavedSearches(userId: string) {
    const [searches, total] = await this.savedSearchRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const active = searches.filter(s => s.isActive).length;

    return {
      total,
      active,
      searches: searches.map(s => ({
        id: s.id,
        name: s.name,
        isActive: s.isActive,
        notifyOnNewMatch: s.notifyOnNewMatch,
        createdAt: s.createdAt,
      })),
    };
  }

  private async getTenantNotifications(userId: string) {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const unread = notifications.filter(n => !n.isRead).length;

    return {
      total,
      unread,
      notifications: notifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
    };
  }

  private async getDalaliProperties(userId: string) {
    const [properties, total] = await this.propertyRepository.findAndCount({
      where: { dalaliId: userId },
      relations: ['inquiries'],
    });

    const active = properties.filter(p => p.status === PropertyStatus.AVAILABLE).length;

    return {
      total,
      active,
      properties: properties.map(p => ({
        id: p.id,
        title: p.title,
        status: p.status,
        price: p.price,
        inquiries: 0,
      })),
    };
  }

  private async getDalaliInquiries(userId: string) {
    const properties = await this.propertyRepository.find({
      where: { dalaliId: userId },
      select: ['id'],
    });

    const propertyIds = properties.map(p => p.id);
    const [inquiries, total] = await this.inquiryRepository.findAndCount({
      where: { propertyId: In(propertyIds) },
      relations: ['tenant', 'property'],
    });

    const pending = inquiries.filter(i => i.status === InquiryStatus.PENDING).length;

    return {
      total,
      pending,
      inquiries: inquiries.map(i => ({
        id: i.id,
        propertyTitle: i.property.title,
        tenantName: `${i.tenant.firstName} ${i.tenant.lastName}`,
        status: i.status,
        createdAt: i.createdAt,
      })),
    };
  }

  private async getDalaliNotifications(userId: string) {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const unread = notifications.filter(n => !n.isRead).length;

    return {
      total,
      unread,
      notifications: notifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
    };
  }

  private getPaymentDistribution(payments: Payment[]) {
    return payments.reduce((acc, payment) => {
      const month = new Date(payment.paidAt).toLocaleString('default', { month: 'long' });
      acc[month] = (acc[month] || 0) + Number(payment.amount);
      return acc;
    }, {});
  }

  private getOccupancyHistory(property: Property, dateRange: { start: Date; end: Date }) {
    // This would typically come from a booking/reservation system
    // For now, return a placeholder structure
    return [];
  }

  private getPropertyTypeDistribution(properties: Property[]) {
    return properties.reduce((acc, property) => {
      acc[property.type] = (acc[property.type] || 0) + 1;
      return acc;
    }, {});
  }

  private getPriceTrend(properties: Property[], timeRange: string) {
    // Group properties by time period and calculate average prices
    const grouped = properties.reduce((acc, property) => {
      const period = this.getTimePeriod(property.createdAt, timeRange);
      if (!acc[period]) {
        acc[period] = [];
      }
      acc[period].push(Number(property.price));
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(grouped).map(([period, prices]) => ({
      period,
      averagePrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
    }));
  }

  private getOccupancyTrend(properties: Property[], timeRange: string) {
    // Group properties by time period and calculate occupancy rates
    const grouped = properties.reduce((acc, property) => {
      const period = this.getTimePeriod(property.createdAt, timeRange);
      if (!acc[period]) {
        acc[period] = { total: 0, occupied: 0 };
      }
      acc[period].total++;
      if (property.status === PropertyStatus.RENTED) {
        acc[period].occupied++;
      }
      return acc;
    }, {} as Record<string, { total: number; occupied: number }>);

    return Object.entries(grouped).map(([period, data]) => ({
      period,
      occupancyRate: (data.occupied / data.total) * 100,
    }));
  }

  private getTimePeriod(date: Date, timeRange: string): string {
    switch (timeRange) {
      case 'day':
        return date.toLocaleTimeString();
      case 'week':
        return date.toLocaleDateString();
      case 'month':
        return date.toLocaleString('default', { month: 'long' });
      case 'year':
        return date.getFullYear().toString();
      default:
        return date.toLocaleDateString();
    }
  }
} 