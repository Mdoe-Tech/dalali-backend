import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateInquiryDto {
  @IsUUID()
  @IsNotEmpty()
  propertyId: string;

  @IsString()
  @IsNotEmpty()
  message: string;
} 