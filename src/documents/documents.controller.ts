import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  Delete,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { DocumentStatus } from './entities/document.entity';
import { multerConfig } from '../config/multer.config';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadDocument(
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    return this.documentsService.uploadDocument(
      req.user.userId,
      createDocumentDto,
      file,
    );
  }

  @Get()
  async getUserDocuments(@Req() req: any) {
    return this.documentsService.getUserDocuments(req.user.userId);
  }

  @Get('property/:propertyId')
  @Roles(UserRole.OWNER, UserRole.DALALI)
  async getPropertyDocuments(
    @Param('propertyId') propertyId: string,
    @Req() req: any,
  ) {
    return this.documentsService.getPropertyDocuments(propertyId, req.user.userId);
  }

  @Get(':id')
  async getDocument(@Param('id') id: string, @Req() req: any) {
    return this.documentsService.getDocument(id, req.user.userId);
  }

  @Patch(':id/status')
  @Roles(UserRole.OWNER, UserRole.DALALI)
  async updateDocumentStatus(
    @Param('id') id: string,
    @Body('status') status: DocumentStatus,
    @Body('rejectionReason') rejectionReason: string,
    @Req() req: any,
  ) {
    return this.documentsService.updateDocumentStatus(
      id,
      status,
      req.user.userId,
      rejectionReason,
    );
  }

  @Patch(':id/verify')
  @Roles(UserRole.OWNER, UserRole.DALALI)
  async verifyDocument(@Param('id') id: string, @Req() req: any) {
    return this.documentsService.verifyDocument(id, req.user.userId);
  }

  @Delete(':id')
  async deleteDocument(@Param('id') id: string, @Req() req: any) {
    return this.documentsService.deleteDocument(id, req.user.userId);
  }
} 