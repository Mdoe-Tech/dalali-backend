import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Property } from '../properties/entities/property.entity';
import { Inquiry } from '../inquiries/entities/inquiry.entity';
import { User } from '../users/entities/user.entity';
import { SavedSearch } from '../properties/entities/saved-search.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Payment } from '../payments/entities/payment.entity';
import { PropertyViewsService } from '../properties/property-views.service';
import { PropertiesModule } from '../properties/properties.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Property,
      Inquiry,
      User,
      SavedSearch,
      Notification,
      Payment,
    ]),
    PropertiesModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, PropertyViewsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {} 