import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { Property } from './entities/property.entity';
import { SavedSearch } from './entities/saved-search.entity';
import { PropertyView } from './entities/property-view.entity';
import { PropertyViewing } from './entities/property-viewing.entity';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { PropertyViewsService } from './property-views.service';
import { PropertyViewingsService } from './property-viewings.service';
import { PropertyViewingsController } from './property-viewings.controller';
import { multerConfig } from '../config/multer.config';
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, SavedSearch, PropertyView, PropertyViewing, User]),
    MulterModule.register(multerConfig),
    NotificationsModule,
  ],
  controllers: [PropertiesController, PropertyViewingsController],
  providers: [PropertiesService, PropertyViewsService, PropertyViewingsService],
  exports: [TypeOrmModule, PropertyViewsService, PropertyViewingsService],
})
export class PropertiesModule {}
