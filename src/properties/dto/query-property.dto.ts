import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { PropertyType, PropertyStatus } from '../entities/property.entity';

export class QueryPropertyDto {
  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minBedrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minBathrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minArea?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxArea?: number;

  @IsOptional()
  @IsString()
  search?: string;
} 