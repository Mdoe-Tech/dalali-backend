import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between, FindOptionsWhere, Like, In } from 'typeorm';
import { Property, PropertyStatus, PropertyType } from './entities/property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertyDto } from './dto/query-property.dto';
import { User } from '../users/entities/user.entity';
import { SearchPropertyDto } from './dto/search-property.dto';
import { SavedSearch } from './entities/saved-search.entity';
import { SaveSearchDto } from './dto/save-search.dto';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SavedSearch)
    private readonly savedSearchRepository: Repository<SavedSearch>,
  ) {}

  async create(createPropertyDto: CreatePropertyDto, ownerId: string): Promise<Property> {
    const owner = await this.userRepository.findOne({ where: { id: ownerId } });
    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    const property = this.propertyRepository.create({
      ...createPropertyDto,
      owner,
    });
    return this.propertyRepository.save(property);
  }

  async findAll(query: QueryPropertyDto): Promise<Property[]> {
    const where: FindOptionsWhere<Property> = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.location) where.location = ILike(`%${query.location}%`);
    
    // Use a reasonable maximum value for PostgreSQL integer
    const MAX_INT = 2147483647; // PostgreSQL integer max value
    
    if (query.minPrice && query.maxPrice) where.price = Between(query.minPrice, query.maxPrice);
    else if (query.minPrice) where.price = Between(query.minPrice, MAX_INT);
    else if (query.maxPrice) where.price = Between(0, query.maxPrice);
    
    if (query.minBedrooms) where.bedrooms = Between(query.minBedrooms, MAX_INT);
    if (query.minBathrooms) where.bathrooms = Between(query.minBathrooms, MAX_INT);
    
    if (query.minArea && query.maxArea) where.area = Between(query.minArea, query.maxArea);
    else if (query.minArea) where.area = Between(query.minArea, MAX_INT);
    else if (query.maxArea) where.area = Between(0, query.maxArea);

    return this.propertyRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Property> {
    const property = await this.propertyRepository.findOne({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto): Promise<Property> {
    const property = await this.findOne(id);
    Object.assign(property, updatePropertyDto);
    return this.propertyRepository.save(property);
  }

  async remove(id: string): Promise<void> {
    const property = await this.findOne(id);
    await this.propertyRepository.remove(property);
  }

  async findByOwner(ownerId: string): Promise<Property[]> {
    return this.propertyRepository.find({ where: { ownerId }, order: { createdAt: 'DESC' } });
  }

  async setStatus(id: string, status: PropertyStatus): Promise<Property> {
    const property = await this.findOne(id);
    property.status = status;
    return this.propertyRepository.save(property);
  }

  async search(searchDto: SearchPropertyDto) {
    const queryBuilder = this.propertyRepository.createQueryBuilder('property')
      .leftJoinAndSelect('property.owner', 'owner')
      .leftJoinAndSelect('property.images', 'images');

    // Apply filters
    if (searchDto.keyword) {
      queryBuilder.andWhere(
        '(property.title ILIKE :keyword OR property.description ILIKE :keyword OR property.location ILIKE :keyword)',
        { keyword: `%${searchDto.keyword}%` }
      );
    }

    if (searchDto.type) {
      queryBuilder.andWhere('property.type = :type', { type: searchDto.type });
    }

    if (searchDto.status) {
      queryBuilder.andWhere('property.status = :status', { status: searchDto.status });
    }

    if (searchDto.minPrice || searchDto.maxPrice) {
      const priceQuery: any = {};
      if (searchDto.minPrice) priceQuery.min = searchDto.minPrice;
      if (searchDto.maxPrice) priceQuery.max = searchDto.maxPrice;
      queryBuilder.andWhere('property.price BETWEEN :minPrice AND :maxPrice', priceQuery);
    }

    if (searchDto.location) {
      queryBuilder.andWhere('property.location ILIKE :location', { location: `%${searchDto.location}%` });
    }

    if (searchDto.amenities && searchDto.amenities.length > 0) {
      queryBuilder.andWhere('property.amenities @> :amenities', { amenities: searchDto.amenities });
    }

    if (searchDto.minBedrooms || searchDto.maxBedrooms) {
      const bedroomsQuery: any = {};
      if (searchDto.minBedrooms) bedroomsQuery.min = searchDto.minBedrooms;
      if (searchDto.maxBedrooms) bedroomsQuery.max = searchDto.maxBedrooms;
      queryBuilder.andWhere('property.bedrooms BETWEEN :minBedrooms AND :maxBedrooms', bedroomsQuery);
    }

    if (searchDto.minBathrooms || searchDto.maxBathrooms) {
      const bathroomsQuery: any = {};
      if (searchDto.minBathrooms) bathroomsQuery.min = searchDto.minBathrooms;
      if (searchDto.maxBathrooms) bathroomsQuery.max = searchDto.maxBathrooms;
      queryBuilder.andWhere('property.bathrooms BETWEEN :minBathrooms AND :maxBathrooms', bathroomsQuery);
    }

    if (searchDto.minArea || searchDto.maxArea) {
      const areaQuery: any = {};
      if (searchDto.minArea) areaQuery.min = searchDto.minArea;
      if (searchDto.maxArea) areaQuery.max = searchDto.maxArea;
      queryBuilder.andWhere('property.area BETWEEN :minArea AND :maxArea', areaQuery);
    }

    // Apply sorting
    queryBuilder.orderBy(`property.${searchDto.sortBy}`, searchDto.sortOrder);

    // Apply pagination
    const skip = (searchDto.page - 1) * searchDto.limit;
    queryBuilder.skip(skip).take(searchDto.limit);

    const [properties, total] = await queryBuilder.getManyAndCount();

    return {
      data: properties,
      meta: {
        total,
        page: searchDto.page,
        limit: searchDto.limit,
        totalPages: Math.ceil(total / searchDto.limit),
      },
    };
  }

  async saveSearch(userId: string, saveSearchDto: SaveSearchDto): Promise<SavedSearch> {
    const savedSearch = this.savedSearchRepository.create({
      userId,
      name: saveSearchDto.name,
      searchCriteria: saveSearchDto,
      notifyOnNewMatch: saveSearchDto.notifyOnNewMatch,
    });

    return this.savedSearchRepository.save(savedSearch);
  }

  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    return this.savedSearchRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteSavedSearch(id: string, userId: string): Promise<void> {
    const result = await this.savedSearchRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException('Saved search not found');
    }
  }

  async updateSavedSearch(id: string, userId: string, updateData: Partial<SaveSearchDto>): Promise<SavedSearch> {
    const savedSearch = await this.savedSearchRepository.findOne({ where: { id, userId } });
    if (!savedSearch) {
      throw new NotFoundException('Saved search not found');
    }

    Object.assign(savedSearch, {
      name: updateData.name,
      searchCriteria: { ...savedSearch.searchCriteria, ...updateData },
      notifyOnNewMatch: updateData.notifyOnNewMatch,
    });

    return this.savedSearchRepository.save(savedSearch);
  }
} 