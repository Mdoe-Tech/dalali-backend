import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentStatus } from './entities/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { User } from '../users/entities/user.entity';
import { Property } from '../properties/entities/property.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async uploadDocument(
    userId: string,
    createDocumentDto: CreateDocumentDto,
    file: Express.Multer.File,
  ): Promise<Document> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (createDocumentDto.propertyId) {
      const property = await this.propertyRepository.findOne({
        where: { id: createDocumentDto.propertyId },
      });
      if (!property) {
        throw new NotFoundException('Property not found');
      }
    }

    const document = this.documentRepository.create({
      ...createDocumentDto,
      uploadedById: userId,
      fileUrl: file.path,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
      status: DocumentStatus.PENDING,
    });

    const savedDocument = await this.documentRepository.save(document);

    // Notify relevant users about the new document
    if (createDocumentDto.propertyId) {
      const property = await this.propertyRepository.findOne({
        where: { id: createDocumentDto.propertyId },
        relations: ['owner'],
      });
      
      await this.notificationsService.create({
        userId: property.ownerId,
        type: NotificationType.DOCUMENT_UPLOADED,
        title: 'New Document Uploaded',
        message: `A new document has been uploaded for property: ${property.title}`,
        data: { documentId: savedDocument.id },
      });
    }

    return savedDocument;
  }

  async getDocument(id: string, userId: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id },
      relations: ['uploadedBy', 'property'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Check if user has permission to view the document
    if (document.uploadedById !== userId && document.property?.ownerId !== userId) {
      throw new BadRequestException('You do not have permission to view this document');
    }

    return document;
  }

  async getUserDocuments(userId: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { uploadedById: userId },
      relations: ['property'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPropertyDocuments(propertyId: string, userId: string): Promise<Document[]> {
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.ownerId !== userId) {
      throw new BadRequestException('You do not have permission to view these documents');
    }

    return this.documentRepository.find({
      where: { propertyId },
      relations: ['uploadedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateDocumentStatus(
    id: string,
    status: DocumentStatus,
    userId: string,
    rejectionReason?: string,
  ): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id },
      relations: ['property', 'uploadedBy'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.property?.ownerId !== userId) {
      throw new BadRequestException('You do not have permission to update this document');
    }

    document.status = status;
    if (status === DocumentStatus.REJECTED && rejectionReason) {
      document.rejectionReason = rejectionReason;
    }

    const savedDocument = await this.documentRepository.save(document);

    // Notify document uploader about status change
    await this.notificationsService.create({
      userId: document.uploadedById,
      type: NotificationType.DOCUMENT_STATUS_CHANGED,
      title: 'Document Status Updated',
      message: `Your document "${document.title}" has been ${status.toLowerCase()}`,
      data: { documentId: savedDocument.id },
    });

    return savedDocument;
  }

  async deleteDocument(id: string, userId: string): Promise<void> {
    const document = await this.documentRepository.findOne({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.uploadedById !== userId) {
      throw new BadRequestException('You can only delete your own documents');
    }

    await this.documentRepository.remove(document);
  }

  async verifyDocument(id: string, userId: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id },
      relations: ['property'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.property?.ownerId !== userId) {
      throw new BadRequestException('You do not have permission to verify this document');
    }

    document.isVerified = true;
    return this.documentRepository.save(document);
  }
} 