import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { PropertyView } from './entities/property-view.entity';
import { Property } from './entities/property.entity';

@Injectable()
export class PropertyViewsService {
  constructor(
    @InjectRepository(PropertyView)
    private readonly propertyViewRepository: Repository<PropertyView>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
  ) {}

  async trackView(
    propertyId: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<PropertyView> {
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    const view = this.propertyViewRepository.create({
      propertyId,
      userId,
      ipAddress,
      userAgent,
    });

    return this.propertyViewRepository.save(view);
  }

  async getPropertyViews(
    propertyId: string,
    timeRange: 'day' | 'week' | 'month' = 'month',
  ) {
    const dateRange = this.getDateRange(timeRange);
    const [views, total] = await this.propertyViewRepository.findAndCount({
      where: {
        propertyId,
        createdAt: Between(dateRange.start, dateRange.end),
      },
      order: { createdAt: 'DESC' },
    });

    const uniqueViewers = new Set(views.map(view => view.userId || view.ipAddress)).size;

    return {
      total,
      uniqueViewers,
      timeRange,
      views: views.map(view => ({
        id: view.id,
        userId: view.userId,
        createdAt: view.createdAt,
      })),
    };
  }

  async getViewsByProperty(propertyIds: string[], timeRange: 'day' | 'week' | 'month' = 'month') {
    const dateRange = this.getDateRange(timeRange);
    const views = await this.propertyViewRepository.find({
      where: {
        propertyId: In(propertyIds),
        createdAt: Between(dateRange.start, dateRange.end),
      },
    });

    return propertyIds.map(propertyId => {
      const propertyViews = views.filter(view => view.propertyId === propertyId);
      const uniqueViewers = new Set(propertyViews.map(view => view.userId || view.ipAddress)).size;

      return {
        propertyId,
        totalViews: propertyViews.length,
        uniqueViewers,
      };
    });
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