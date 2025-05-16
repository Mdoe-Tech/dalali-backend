import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Dalali API')
    .setDescription('The Dalali API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('properties', 'Property management endpoints')
    .addTag('reviews', 'Review management endpoints')
    .addTag('payments', 'Payment management endpoints')
    .addTag('documents', 'Document management endpoints')
    .addTag('notifications', 'Notification management endpoints')
    .addTag('search', 'Search functionality endpoints')
    .addTag('analytics', 'Analytics and reporting endpoints')
    .addTag('admin', 'Admin management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
} 