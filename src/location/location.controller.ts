import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { LocationService } from './location.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('location')
@ApiBearerAuth()
@Controller('location')
@UseGuards(JwtAuthGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('property/:id')
  @ApiOperation({ summary: 'Get property location details' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({ status: 200, description: 'Property location retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async getPropertyLocation(@Param('id') propertyId: string) {
    return this.locationService.getPropertyLocation(propertyId);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find properties near a location' })
  @ApiQuery({ name: 'latitude', description: 'Latitude coordinate', type: Number })
  @ApiQuery({ name: 'longitude', description: 'Longitude coordinate', type: Number })
  @ApiQuery({ name: 'radius', description: 'Search radius in meters', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Nearby properties retrieved successfully' })
  async getNearbyProperties(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius?: number,
  ) {
    return this.locationService.getNearbyProperties(latitude, longitude, radius);
  }

  @Get('directions')
  @ApiOperation({ summary: 'Get directions between two points' })
  @ApiQuery({ name: 'originLat', description: 'Origin latitude', type: Number })
  @ApiQuery({ name: 'originLng', description: 'Origin longitude', type: Number })
  @ApiQuery({ name: 'destLat', description: 'Destination latitude', type: Number })
  @ApiQuery({ name: 'destLng', description: 'Destination longitude', type: Number })
  @ApiResponse({ status: 200, description: 'Directions retrieved successfully' })
  async getDirections(
    @Query('originLat') originLat: number,
    @Query('originLng') originLng: number,
    @Query('destLat') destLat: number,
    @Query('destLng') destLng: number,
  ) {
    return this.locationService.getDirections(
      { lat: originLat, lng: originLng },
      { lat: destLat, lng: destLng },
    );
  }
} 