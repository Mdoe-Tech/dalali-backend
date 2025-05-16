import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from '../properties/entities/property.entity';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class DalaliService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getDalaliProperties(dalaliId: string): Promise<Property[]> {
    const dalali = await this.userRepository.findOne({
      where: { id: dalaliId, role: UserRole.DALALI },
    });
    if (!dalali) throw new NotFoundException('Dalali not found');
    return this.propertyRepository.find({
      where: { ownerId: dalaliId },
      relations: ['owner'],
    });
  }

  async calculateCommission(propertyId: string): Promise<{ commission: number; total: number }> {
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
      relations: ['owner'],
    });
    if (!property) throw new NotFoundException('Property not found');

    const commissionRate = 0.05; // 5% commission
    const commission = property.price * commissionRate;
    const total = property.price + commission;

    return { commission, total };
  }

  async getDalaliStats(dalaliId: string): Promise<{
    totalProperties: number;
    totalCommission: number;
    activeListings: number;
  }> {
    const properties = await this.getDalaliProperties(dalaliId);
    const totalProperties = properties.length;
    const activeListings = properties.filter(p => p.status === 'available').length;
    const totalCommission = properties.reduce((sum, p) => sum + (p.price * 0.05), 0);

    return {
      totalProperties,
      totalCommission,
      activeListings,
    };
  }
} 