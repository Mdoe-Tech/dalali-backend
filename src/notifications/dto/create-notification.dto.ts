import { IsString, IsEnum, IsOptional, IsNumber, IsUUID } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';
import { Type, Transform } from 'class-transformer';

export class CreateNotificationDto {
  @IsNumber()
  @Type(() => Number)
  @Transform(({ value }) => Number(value))
  userId: number;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @Transform(({ value }) => value ? JSON.stringify(value) : null)
  data?: any;
} 