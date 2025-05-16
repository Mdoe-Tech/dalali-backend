# Dalali Real Estate Platform

A comprehensive real estate management platform built with NestJS, providing a robust backend solution for property listings, user management, and real estate transactions.

## 📋 System Overview

Dalali is a sophisticated real estate management platform designed to streamline and modernize property transactions in the real estate market. The backend system serves as the core engine that powers various aspects of real estate operations, from property listings to transaction management.

### Core Purpose
- Facilitate seamless property transactions between property owners, real estate agents (Dalalis), and potential buyers/tenants
- Provide a secure and efficient platform for property management and real estate operations
- Enable data-driven decision making through comprehensive analytics and reporting
- Support multiple stakeholders in the real estate ecosystem

### Key Stakeholders
1. **Property Owners**
   - List and manage their properties
   - Track property inquiries and viewings
   - Manage property documents and contracts
   - Monitor property performance and analytics

2. **Real Estate Agents (Dalalis)**
   - Manage property listings and client relationships
   - Schedule and coordinate property viewings
   - Handle property inquiries and negotiations
   - Access commission tracking and payment management

3. **Tenants/Buyers**
   - Search and filter properties based on preferences
   - Schedule property viewings
   - Submit inquiries and offers
   - Track application status and documentation

4. **Administrators**
   - Oversee platform operations
   - Manage user accounts and permissions
   - Monitor system performance and security
   - Generate reports and analytics

### System Capabilities

#### Property Management
- Comprehensive property listing system with detailed specifications
- Support for multiple property types (residential, commercial, land)
- Advanced search and filtering capabilities
- Location-based property discovery
- Property status tracking and history

#### Transaction Management
- Secure payment processing
- Document management and verification
- Contract generation and management
- Transaction history and audit trails

#### Communication System
- Real-time notifications
- In-app messaging
- Email notifications
- SMS alerts for critical updates

#### Analytics and Reporting
- Property performance metrics
- Market trend analysis
- User activity tracking
- Financial reporting
- Custom report generation

#### Security and Compliance
- Role-based access control
- Data encryption
- Audit logging
- GDPR compliance
- Regular security updates

## 🚀 Features

- **User Management**
  - Multi-role system (Admin, Owner, Dalali, Tenant)
  - Secure authentication and authorization
  - Profile management

- **Property Management**
  - Detailed property listings
  - Multiple property types (House, Apartment, Land, Commercial)
  - Property status tracking
  - Image management
  - Location-based search

- **Real Estate Operations**
  - Property viewings scheduling
  - Inquiry management
  - Document handling
  - Payment processing
  - Analytics and reporting

- **Additional Features**
  - Real-time notifications
  - Mobile API support
  - Internationalization (i18n)
  - Caching system
  - Rate limiting
  - Comprehensive logging
  - Swagger API documentation

## 🛠️ Tech Stack

- **Framework:** NestJS
- **Database:** PostgreSQL with TypeORM
- **Authentication:** JWT
- **File Upload:** Multer
- **Documentation:** Swagger/OpenAPI
- **Caching:** Custom caching module
- **Email:** Custom email module
- **Logging:** Custom logging service

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn
- Git

## 🔧 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dalali-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=dalali_db

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=24h

# Server
PORT=9000
FRONTEND_URL=http://localhost:3000

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

4. Run database migrations:
```bash
npm run migration:run
```

5. Start the development server:
```bash
npm run start:dev
```

## 🏗️ Project Structure

```
src/
├── admin/           # Admin-specific features
├── analytics/       # Analytics and reporting
├── auth/           # Authentication and authorization
├── common/         # Shared utilities and services
├── config/         # Configuration files
├── dalali/         # Dalali-specific features
├── documents/      # Document management
├── inquiries/      # Property inquiries
├── location/       # Location services
├── notifications/  # Notification system
├── payments/       # Payment processing
├── properties/     # Property management
├── users/          # User management
└── websocket/      # Real-time features
```

## 📚 API Documentation

Once the server is running, you can access the Swagger API documentation at:
```
http://localhost:9000/api/docs
```

## 🧪 Testing

Run the test suite:
```bash
# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🔐 Security

- JWT-based authentication
- Role-based access control
- Rate limiting
- Input validation
- CORS protection
- Secure password hashing

## 📦 Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm run start:prod
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- NestJS team for the amazing framework
- All contributors who have helped shape this project
