import { IsEnum, IsInt, IsString, IsOptional, Min, Max, IsUUID } from 'class-validator';
import { ReviewType } from '../entities/review.entity';

export class CreateReviewDto {
  @IsEnum(ReviewType)
  type: ReviewType;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  comment: string;

  @IsOptional()
  @IsUUID()
  reviewedUserId?: string;

  @IsOptional()
  @IsUUID()
  propertyId?: string;
} 