import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Property } from '../properties/entities/property.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class LocationService {
  private readonly googleMapsApiKey: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,
  ) {
    this.googleMapsApiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
  }

  async getPropertyLocation(propertyId: string) {
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
      select: ['id', 'latitude', 'longitude', 'location', 'title'],
    });

    if (!property) {
      throw new Error('Property not found');
    }

    return {
      id: property.id,
      title: property.title,
      location: property.location,
      coordinates: {
        lat: property.latitude,
        lng: property.longitude,
      },
    };
  }

  async getNearbyProperties(latitude: number, longitude: number, radius: number = 5000) {
    // Using PostGIS for efficient geospatial queries
    const properties = await this.propertyRepository
      .createQueryBuilder('property')
      .where(
        `ST_DWithin(
          ST_SetSRID(ST_MakePoint(property.longitude, property.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :radius
        )`,
        { longitude, latitude, radius }
      )
      .select([
        'property.id',
        'property.title',
        'property.location',
        'property.latitude',
        'property.longitude',
        'property.price',
        'property.type',
      ])
      .getMany();

    return properties.map(property => ({
      ...property,
      distance: this.calculateDistance(
        latitude,
        longitude,
        property.latitude,
        property.longitude
      ),
    }));
  }

  async getDirections(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) {
    // This would typically call Google Maps Directions API
    // For now, return a mock response
    return {
      distance: this.calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng),
      duration: '30 mins', // This would come from Google Maps API
      steps: [
        {
          instruction: 'Head north',
          distance: '100m',
          duration: '1 min',
        },
        // More steps would come from Google Maps API
      ],
    };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
} 