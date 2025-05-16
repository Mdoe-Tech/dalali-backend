import { IsDate, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ScheduleViewingDto {
  @Type(() => Date)
  @IsDate()
  scheduledDate: Date;

  @IsInt()
  @Min(15)
  duration: number;

  @IsString()
  @IsOptional()
  notes?: string;
} 