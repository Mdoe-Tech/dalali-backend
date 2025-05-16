import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DalaliService } from './dalali.service';
import { DalaliController } from './dalali.controller';
import { Property } from '../properties/entities/property.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, User]),
  ],
  controllers: [DalaliController],
  providers: [DalaliService],
  exports: [DalaliService],
})
export class DalaliModule {}
