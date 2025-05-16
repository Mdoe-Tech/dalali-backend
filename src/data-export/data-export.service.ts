import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from '../properties/entities/property.entity';
import { User } from '../users/entities/user.entity';
import { Inquiry } from '../inquiries/entities/inquiry.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Review } from '../reviews/entities/review.entity';
import * as ExcelJS from 'exceljs';
import * as csv from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DataExportService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Inquiry)
    private readonly inquiryRepository: Repository<Inquiry>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async exportToExcel(userId: string, dataType: 'properties' | 'inquiries' | 'payments' | 'reviews'): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(dataType);

    let data: any[];
    switch (dataType) {
      case 'properties':
        data = await this.propertyRepository.find({
          where: { ownerId: userId },
          relations: ['owner'],
        });
        worksheet.columns = [
          { header: 'ID', key: 'id' },
          { header: 'Title', key: 'title' },
          { header: 'Description', key: 'description' },
          { header: 'Type', key: 'type' },
          { header: 'Status', key: 'status' },
          { header: 'Price', key: 'price' },
          { header: 'Location', key: 'location' },
          { header: 'Created At', key: 'createdAt' },
        ];
        break;
      case 'inquiries':
        data = await this.inquiryRepository.find({
          where: { tenantId: userId },
          relations: ['property'],
        });
        worksheet.columns = [
          { header: 'ID', key: 'id' },
          { header: 'Property', key: 'property.title' },
          { header: 'Status', key: 'status' },
          { header: 'Message', key: 'message' },
          { header: 'Created At', key: 'createdAt' },
        ];
        break;
      case 'payments':
        data = await this.paymentRepository.find({
          where: { payerId: userId },
          relations: ['property'],
        });
        worksheet.columns = [
          { header: 'ID', key: 'id' },
          { header: 'Amount', key: 'amount' },
          { header: 'Status', key: 'status' },
          { header: 'Property', key: 'property.title' },
          { header: 'Paid At', key: 'paidAt' },
        ];
        break;
      case 'reviews':
        data = await this.reviewRepository.find({
          where: { reviewerId: userId },
          relations: ['property'],
        });
        worksheet.columns = [
          { header: 'ID', key: 'id' },
          { header: 'Rating', key: 'rating' },
          { header: 'Comment', key: 'comment' },
          { header: 'Property', key: 'property.title' },
          { header: 'Created At', key: 'createdAt' },
        ];
        break;
    }

    worksheet.addRows(data);

    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }

    const fileName = `${dataType}_${userId}_${Date.now()}.xlsx`;
    const filePath = path.join(exportDir, fileName);
    await workbook.xlsx.writeFile(filePath);

    return filePath;
  }

  async exportToCSV(userId: string, dataType: 'properties' | 'inquiries' | 'payments' | 'reviews'): Promise<string> {
    let data: any[];
    let headers: string[];

    switch (dataType) {
      case 'properties':
        data = await this.propertyRepository.find({
          where: { ownerId: userId },
          relations: ['owner'],
        });
        headers = ['id', 'title', 'description', 'type', 'status', 'price', 'location', 'createdAt'];
        break;
      case 'inquiries':
        data = await this.inquiryRepository.find({
          where: { tenantId: userId },
          relations: ['property'],
        });
        headers = ['id', 'property.title', 'status', 'message', 'createdAt'];
        break;
      case 'payments':
        data = await this.paymentRepository.find({
          where: { payerId: userId },
          relations: ['property'],
        });
        headers = ['id', 'amount', 'status', 'property.title', 'paidAt'];
        break;
      case 'reviews':
        data = await this.reviewRepository.find({
          where: { reviewerId: userId },
          relations: ['property'],
        });
        headers = ['id', 'rating', 'comment', 'property.title', 'createdAt'];
        break;
    }

    const csvContent = this.convertToCSV(data, headers);

    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }

    const fileName = `${dataType}_${userId}_${Date.now()}.csv`;
    const filePath = path.join(exportDir, fileName);
    fs.writeFileSync(filePath, csvContent);

    return filePath;
  }

  async importFromCSV(userId: string, dataType: 'properties' | 'inquiries' | 'payments' | 'reviews', filePath: string): Promise<any[]> {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    const results = [];
    for (const record of records) {
      try {
        let entity;
        switch (dataType) {
          case 'properties':
            entity = this.propertyRepository.create({
              ...record,
              ownerId: userId,
            });
            break;
          case 'inquiries':
            entity = this.inquiryRepository.create({
              ...record,
              tenantId: userId,
            });
            break;
          case 'payments':
            entity = this.paymentRepository.create({
              ...record,
              payerId: userId,
            });
            break;
          case 'reviews':
            entity = this.reviewRepository.create({
              ...record,
              reviewerId: userId,
            });
            break;
        }

        const savedEntity = await this[`${dataType}Repository`].save(entity);
        results.push(savedEntity);
      } catch (error) {
        results.push({
          error: `Failed to import record: ${error.message}`,
          record,
        });
      }
    }

    return results;
  }

  private convertToCSV(data: any[], headers: string[]): string {
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        const value = header.split('.').reduce((obj, key) => obj?.[key], row);
        return value ? `"${value}"` : '';
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }
} 