import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, In, ILike } from 'typeorm';
import { Property } from '../properties/entities/property.entity';
import { User } from '../users/entities/user.entity';
import { Review } from '../reviews/entities/review.entity';
import { PropertyType, PropertyStatus } from '../properties/entities/property.entity';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async searchProperties(params: {
    query?: string;
    type?: PropertyType;
    status?: PropertyStatus;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    bedrooms?: number;
    bathrooms?: number;
    features?: string[];
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    const {
      query,
      type,
      status,
      minPrice,
      maxPrice,
      location,
      bedrooms,
      bathrooms,
      features,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = params;

    const queryBuilder = this.propertyRepository.createQueryBuilder('property')
      .leftJoinAndSelect('property.owner', 'owner')
      .leftJoinAndSelect('property.reviews', 'reviews');

    if (query) {
      queryBuilder.where(
        '(property.title ILIKE :query OR property.description ILIKE :query)',
        { query: `%${query}%` }
      );
    }

    if (type) {
      queryBuilder.andWhere('property.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('property.status = :status', { status });
    }

    if (minPrice) {
      queryBuilder.andWhere('property.price >= :minPrice', { minPrice });
    }

    if (maxPrice) {
      queryBuilder.andWhere('property.price <= :maxPrice', { maxPrice });
    }

    if (location) {
      queryBuilder.andWhere('property.location ILIKE :location', { location: `%${location}%` });
    }

    if (bedrooms) {
      queryBuilder.andWhere('property.bedrooms >= :bedrooms', { bedrooms });
    }

    if (bathrooms) {
      queryBuilder.andWhere('property.bathrooms >= :bathrooms', { bathrooms });
    }

    if (features && features.length > 0) {
      queryBuilder.andWhere('property.features @> :features', { features });
    }

    // Add sorting
    queryBuilder.orderBy(`property.${sortBy}`, sortOrder);

    // Add pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [properties, total] = await queryBuilder.getManyAndCount();

    return {
      properties,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchUsers(params: {
    query?: string;
    role?: UserRole;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    const {
      query,
      role,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = params;

    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.reviews', 'reviews');

    if (query) {
      queryBuilder.where(
        '(user.firstName ILIKE :query OR user.lastName ILIKE :query OR user.email ILIKE :query)',
        { query: `%${query}%` }
      );
    }

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    queryBuilder.orderBy(`user.${sortBy}`, sortOrder);
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchReviews(params: {
    query?: string;
    type?: 'property' | 'user';
    minRating?: number;
    maxRating?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    const {
      query,
      type,
      minRating,
      maxRating,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = params;

    const queryBuilder = this.reviewRepository.createQueryBuilder('review')
      .leftJoinAndSelect('review.reviewer', 'reviewer')
      .leftJoinAndSelect('review.reviewedUser', 'reviewedUser')
      .leftJoinAndSelect('review.property', 'property');

    if (query) {
      queryBuilder.where('review.comment ILIKE :query', { query: `%${query}%` });
    }

    if (type) {
      queryBuilder.andWhere('review.type = :type', { type });
    }

    if (minRating) {
      queryBuilder.andWhere('review.rating >= :minRating', { minRating });
    }

    if (maxRating) {
      queryBuilder.andWhere('review.rating <= :maxRating', { maxRating });
    }

    queryBuilder.orderBy(`review.${sortBy}`, sortOrder);
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [reviews, total] = await queryBuilder.getManyAndCount();

    return {
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
} 