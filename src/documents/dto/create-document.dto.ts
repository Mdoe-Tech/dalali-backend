import { IsString, IsEnum, IsOptional, IsDate, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentType } from '../entities/document.entity';

export class CreateDocumentDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(DocumentType)
  type: DocumentType;

  @IsUUID()
  @IsOptional()
  propertyId?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expiryDate?: Date;
} 