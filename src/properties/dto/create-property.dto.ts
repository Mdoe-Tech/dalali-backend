import { IsString, IsNumber, IsEnum, IsArray, IsOptional, IsLatitude, IsLongitude } from 'class-validator';
import { Transform } from 'class-transformer';
import { PropertyType, PropertyStatus } from '../entities/property.entity';

export class CreatePropertyDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(PropertyType)
  type: PropertyType;

  @IsEnum(PropertyStatus)
  @IsOptional()
  status?: PropertyStatus;

  @IsNumber()
  price: number;

  @IsString()
  location: string;

  @IsLatitude()
  @IsOptional()
  latitude?: number;

  @IsLongitude()
  @IsOptional()
  longitude?: number;

  @IsNumber()
  @IsOptional()
  bedrooms?: number;

  @IsNumber()
  @IsOptional()
  bathrooms?: number;

  @IsNumber()
  @IsOptional()
  area?: number;

  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // If JSON parsing fails, try splitting by comma
        return value.split(',').map(item => item.trim());
      }
    }
    return Array.isArray(value) ? value : [value];
  })
  features: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
} 