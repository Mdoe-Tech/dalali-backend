import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendPropertyCreatedNotification(email: string, propertyTitle: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Property Listed Successfully',
      template: 'property-created',
      context: {
        propertyTitle,
        dashboardUrl: this.configService.get('FRONTEND_URL') + '/dashboard',
      },
    });
  }

  async sendPropertyStatusUpdateNotification(email: string, propertyTitle: string, status: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Property Status Updated',
      template: 'property-status-updated',
      context: {
        propertyTitle,
        status,
        dashboardUrl: this.configService.get('FRONTEND_URL') + '/dashboard',
      },
    });
  }

  async sendCommissionNotification(email: string, propertyTitle: string, commission: number) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'New Commission Earned',
      template: 'commission-earned',
      context: {
        propertyTitle,
        commission,
        dashboardUrl: this.configService.get('FRONTEND_URL') + '/dashboard',
      },
    });
  }
} 