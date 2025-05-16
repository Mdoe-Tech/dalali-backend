import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataExportService } from './data-export.service';
import { DataExportController } from './data-export.controller';
import { Property } from '../properties/entities/property.entity';
import { User } from '../users/entities/user.entity';
import { Inquiry } from '../inquiries/entities/inquiry.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Review } from '../reviews/entities/review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Property,
      User,
      Inquiry,
      Payment,
      Review,
    ]),
  ],
  controllers: [DataExportController],
  providers: [DataExportService],
  exports: [DataExportService],
})
export class DataExportModule {} 