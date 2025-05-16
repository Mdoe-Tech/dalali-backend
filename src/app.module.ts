import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PropertiesModule } from './properties/properties.module';
import { DalaliModule } from './dalali/dalali.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './common/email/email.module';
import { CacheModule } from './common/cache/cache.module';
import { MulterModule } from '@nestjs/platform-express';
import { multerConfig } from './config/multer.config';
import { LoggerModule } from './common/logger/logger.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { InquiriesModule } from './inquiries/inquiries.module';
import { NotificationsModule } from './notifications/notifications.module';
import { databaseConfig } from './config/database.config';
import { AnalyticsModule } from './analytics/analytics.module';
import { DocumentsModule } from './documents/documents.module';
import { LocationModule } from './location/location.module';
import { DataExportModule } from './data-export/data-export.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: databaseConfig,
      inject: [ConfigService],
    }),
    MulterModule.register(multerConfig),
    CacheModule,
    EmailModule,
    UsersModule,
    LoggerModule,
    AuthModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // 1 minute
        limit: 20,   // 20 requests per minute
      },
    ]),
    NotificationsModule,
    PropertiesModule,
    InquiriesModule,
    AnalyticsModule,
    DocumentsModule,
    LocationModule,
    DataExportModule,
    DalaliModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
