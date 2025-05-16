import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards, Request } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('reviews')
@ApiBearerAuth()
@Controller('reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Roles(UserRole.TENANT, UserRole.OWNER, UserRole.DALALI)
  @ApiOperation({ summary: 'Create a new review' })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  create(@Body() createReviewDto: CreateReviewDto, @Request() req) {
    return this.reviewsService.createReview(req.user.userId, createReviewDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a review by ID' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  getReview(@Param('id') id: string) {
    return this.reviewsService.getReview(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all reviews for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User reviews retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUserReviews(@Param('userId') userId: string) {
    return this.reviewsService.getUserReviews(userId);
  }

  @Get('property/:propertyId')
  @ApiOperation({ summary: 'Get all reviews for a property' })
  @ApiParam({ name: 'propertyId', description: 'Property ID' })
  @ApiResponse({ status: 200, description: 'Property reviews retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  getPropertyReviews(@Param('propertyId') propertyId: string) {
    return this.reviewsService.getPropertyReviews(propertyId);
  }

  @Get('user/:userId/stats')
  @ApiOperation({ summary: 'Get rating statistics for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User rating statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUserRatingStats(@Param('userId') userId: string) {
    return this.reviewsService.getUserRatingStats(userId);
  }

  @Get('property/:propertyId/stats')
  @ApiOperation({ summary: 'Get rating statistics for a property' })
  @ApiParam({ name: 'propertyId', description: 'Property ID' })
  @ApiResponse({ status: 200, description: 'Property rating statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  getPropertyRatingStats(@Param('propertyId') propertyId: string) {
    return this.reviewsService.getPropertyRatingStats(propertyId);
  }

  @Patch(':id/verify')
  @Roles(UserRole.OWNER, UserRole.DALALI)
  @ApiOperation({ summary: 'Verify a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review verified successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  verifyReview(@Param('id') id: string, @Request() req) {
    return this.reviewsService.verifyReview(id, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  deleteReview(@Param('id') id: string, @Request() req) {
    return this.reviewsService.deleteReview(id, req.user.id);
  }
} 