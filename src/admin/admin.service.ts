import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Property, PropertyStatus } from '../properties/entities/property.entity';
import { Review } from '../reviews/entities/review.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getUsers(params: {
    page?: number;
    limit?: number;
    role?: UserRole;
    search?: string;
  }) {
    const { page = 1, limit = 10, role, search } = params;
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (role) {
      queryBuilder.where('user.role = :role', { role });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [users, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUser(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['properties', 'reviews'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserRole(id: string, role: UserRole) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = role;
    const updatedUser = await this.userRepository.save(user);

    await this.notificationsService.create({
      userId: Number(id),
      type: NotificationType.ROLE_UPDATED,
      title: 'Role Updated',
      message: `Your role has been updated to ${role}`,
    });

    return updatedUser;
  }

  async deleteUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.remove(user);
    return { message: 'User deleted successfully' };
  }

  async getProperties(params: {
    page?: number;
    limit?: number;
    status?: PropertyStatus;
    search?: string;
  }) {
    const { page = 1, limit = 10, status, search } = params;
    const queryBuilder = this.propertyRepository.createQueryBuilder('property')
      .leftJoinAndSelect('property.owner', 'owner');

    if (status) {
      queryBuilder.where('property.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(property.title ILIKE :search OR property.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [properties, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      properties,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProperty(id: string) {
    const property = await this.propertyRepository.findOne({
      where: { id },
      relations: ['owner', 'reviews'],
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  async updatePropertyStatus(id: string, status: PropertyStatus) {
    const property = await this.propertyRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    property.status = status;
    const updatedProperty = await this.propertyRepository.save(property);

    await this.notificationsService.create({
      userId: Number(property.ownerId),
      type: NotificationType.PROPERTY_STATUS_CHANGED,
      title: 'Property Status Updated',
      message: `Your property "${property.title}" status has been updated to ${status}`,
    });

    return updatedProperty;
  }

  async deleteProperty(id: string) {
    const property = await this.propertyRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    await this.propertyRepository.remove(property);

    await this.notificationsService.create({
      userId: Number(property.ownerId),
      type: NotificationType.PROPERTY_DELETED,
      title: 'Property Deleted',
      message: `Your property "${property.title}" has been deleted by an administrator`,
    });

    return { message: 'Property deleted successfully' };
  }

  async getReviews(params: {
    page?: number;
    limit?: number;
    type?: 'property' | 'user';
    search?: string;
  }) {
    const { page = 1, limit = 10, type, search } = params;
    const queryBuilder = this.reviewRepository.createQueryBuilder('review')
      .leftJoinAndSelect('review.reviewer', 'reviewer')
      .leftJoinAndSelect('review.reviewedUser', 'reviewedUser')
      .leftJoinAndSelect('review.property', 'property');

    if (type) {
      queryBuilder.where('review.type = :type', { type });
    }

    if (search) {
      queryBuilder.andWhere('review.comment ILIKE :search', { search: `%${search}%` });
    }

    const [reviews, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getReview(id: string) {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['reviewer', 'reviewedUser', 'property'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async deleteReview(id: string) {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['reviewer'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.reviewRepository.remove(review);

    await this.notificationsService.create({
      userId: Number(review.reviewerId),
      type: NotificationType.REVIEW_DELETED,
      title: 'Review Deleted',
      message: 'Your review has been deleted by an administrator',
    });

    return { message: 'Review deleted successfully' };
  }

  async getDashboard() {
    const [
      totalUsers,
      totalProperties,
      totalReviews,
      recentUsers,
      recentProperties,
      recentReviews,
    ] = await Promise.all([
      this.userRepository.count(),
      this.propertyRepository.count(),
      this.reviewRepository.count(),
      this.userRepository.find({
        order: { createdAt: 'DESC' },
        take: 5,
      }),
      this.propertyRepository.find({
        order: { createdAt: 'DESC' },
        take: 5,
      }),
      this.reviewRepository.find({
        order: { createdAt: 'DESC' },
        take: 5,
        relations: ['reviewer', 'property'],
      }),
    ]);

    return {
      stats: {
        totalUsers,
        totalProperties,
        totalReviews,
      },
      recent: {
        users: recentUsers,
        properties: recentProperties,
        reviews: recentReviews,
      },
    };
  }

  async getReports(params: {
    type?: 'user' | 'property' | 'review';
    page?: number;
    limit?: number;
  }) {
    // Implementation for handling user reports
    // This would typically involve a separate reports table
    return {
      message: 'Reports functionality to be implemented',
    };
  }

  async resolveReport(id: string, action: 'warn' | 'suspend' | 'delete') {
    // Implementation for resolving reports
    // This would typically involve a separate reports table
    return {
      message: 'Report resolution functionality to be implemented',
    };
  }
} 