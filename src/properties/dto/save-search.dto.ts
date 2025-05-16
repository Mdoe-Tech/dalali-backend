import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { SearchPropertyDto } from './search-property.dto';

export class SaveSearchDto extends SearchPropertyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  notifyOnNewMatch?: boolean = false;
} 