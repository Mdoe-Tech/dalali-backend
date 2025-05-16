import { Controller, Get, Post, UseGuards, Req, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DataExportService } from './data-export.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { multerConfig } from '../config/multer.config';

@ApiTags('data-export')
@ApiBearerAuth()
@Controller('data-export')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DataExportController {
  constructor(private readonly dataExportService: DataExportService) {}

  @Get('excel/:dataType')
  @Roles(UserRole.OWNER, UserRole.TENANT, UserRole.DALALI)
  @ApiOperation({ summary: 'Export data to Excel file' })
  @ApiResponse({ status: 200, description: 'Data exported successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async exportToExcel(
    @Param('dataType') dataType: 'properties' | 'inquiries' | 'payments' | 'reviews',
    @Req() req: any,
  ) {
    const filePath = await this.dataExportService.exportToExcel(req.user.userId, dataType);
    return { filePath };
  }

  @Get('csv/:dataType')
  @Roles(UserRole.OWNER, UserRole.TENANT, UserRole.DALALI)
  @ApiOperation({ summary: 'Export data to CSV file' })
  @ApiResponse({ status: 200, description: 'Data exported successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async exportToCSV(
    @Param('dataType') dataType: 'properties' | 'inquiries' | 'payments' | 'reviews',
    @Req() req: any,
  ) {
    const filePath = await this.dataExportService.exportToCSV(req.user.userId, dataType);
    return { filePath };
  }

  @Post('import/csv/:dataType')
  @Roles(UserRole.OWNER, UserRole.TENANT, UserRole.DALALI)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiOperation({ summary: 'Import data from CSV file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Data imported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async importFromCSV(
    @Param('dataType') dataType: 'properties' | 'inquiries' | 'payments' | 'reviews',
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const results = await this.dataExportService.importFromCSV(req.user.userId, dataType, file.path);
    return { results };
  }
} 