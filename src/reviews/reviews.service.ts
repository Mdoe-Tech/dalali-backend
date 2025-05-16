import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, ReviewType } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { User } from '../users/entities/user.entity';
import { Property } from '../properties/entities/property.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createReview(userId: string, createReviewDto: CreateReviewDto): Promise<Review> {
    const reviewer = await this.userRepository.findOne({ where: { id: userId } });
    if (!reviewer) {
      throw new NotFoundException('Reviewer not found');
    }

    if (createReviewDto.type === ReviewType.USER && !createReviewDto.reviewedUserId) {
      throw new BadRequestException('Reviewed user ID is required for user reviews');
    }

    if (createReviewDto.type === ReviewType.PROPERTY && !createReviewDto.propertyId) {
      throw new BadRequestException('Property ID is required for property reviews');
    }

    if (createReviewDto.reviewedUserId) {
      const reviewedUser = await this.userRepository.findOne({
        where: { id: createReviewDto.reviewedUserId },
      });
      if (!reviewedUser) {
        throw new NotFoundException('Reviewed user not found');
      }
    }

    if (createReviewDto.propertyId) {
      const property = await this.propertyRepository.findOne({
        where: { id: createReviewDto.propertyId },
      });
      if (!property) {
        throw new NotFoundException('Property not found');
      }
    }

    const review = this.reviewRepository.create({
      ...createReviewDto,
      reviewerId: userId,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Notify the reviewed user or property owner
    if (createReviewDto.type === ReviewType.USER && createReviewDto.reviewedUserId) {
      await this.notificationsService.create({
        userId: Number(createReviewDto.reviewedUserId),
        type: NotificationType.REVIEW_RECEIVED,
        title: 'New Review Received',
        message: `You have received a new ${createReviewDto.rating}-star review`,
        data: { reviewId: savedReview.id },
      });
    } else if (createReviewDto.type === ReviewType.PROPERTY && createReviewDto.propertyId) {
      const property = await this.propertyRepository.findOne({
        where: { id: createReviewDto.propertyId },
        relations: ['owner'],
      });
      if (property) {
        await this.notificationsService.create({
          userId: Number(property.ownerId),
          type: NotificationType.REVIEW_RECEIVED,
          title: 'New Property Review',
          message: `Your property has received a new ${createReviewDto.rating}-star review`,
          data: { reviewId: savedReview.id },
        });
      }
    }

    return savedReview;
  }

  async getReview(id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['reviewer', 'reviewedUser', 'property'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async getUserReviews(userId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { reviewedUserId: userId },
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPropertyReviews(propertyId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { propertyId },
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUserRatingStats(userId: string): Promise<any> {
    const reviews = await this.reviewRepository.find({
      where: { reviewedUserId: userId },
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    const ratingDistribution = {
      1: reviews.filter(r => r.rating === 1).length,
      2: reviews.filter(r => r.rating === 2).length,
      3: reviews.filter(r => r.rating === 3).length,
      4: reviews.filter(r => r.rating === 4).length,
      5: reviews.filter(r => r.rating === 5).length,
    };

    return {
      totalReviews,
      averageRating,
      ratingDistribution,
    };
  }

  async getPropertyRatingStats(propertyId: string): Promise<any> {
    const reviews = await this.reviewRepository.find({
      where: { propertyId },
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    const ratingDistribution = {
      1: reviews.filter(r => r.rating === 1).length,
      2: reviews.filter(r => r.rating === 2).length,
      3: reviews.filter(r => r.rating === 3).length,
      4: reviews.filter(r => r.rating === 4).length,
      5: reviews.filter(r => r.rating === 5).length,
    };

    return {
      totalReviews,
      averageRating,
      ratingDistribution,
    };
  }

  async verifyReview(id: string, userId: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['property'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.type === ReviewType.PROPERTY && review.property?.ownerId !== userId) {
      throw new BadRequestException('Only property owners can verify property reviews');
    }

    review.isVerified = true;
    return this.reviewRepository.save(review);
  }

  async deleteReview(id: string, userId: string): Promise<void> {
    const review = await this.reviewRepository.findOne({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.reviewerId !== userId) {
      throw new BadRequestException('You can only delete your own reviews');
    }

    await this.reviewRepository.remove(review);
  }
} 