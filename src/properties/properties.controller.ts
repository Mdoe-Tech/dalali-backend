import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards, HttpCode, HttpStatus, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertyDto } from './dto/query-property.dto';
import { SearchPropertyDto } from './dto/search-property.dto';
import { SaveSearchDto } from './dto/save-search.dto';
import { PropertyStatus } from './entities/property.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.DALALI, UserRole.ADMIN)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'images', maxCount: 10 },
  ]))
  async create(
    @Body() createPropertyDto: CreatePropertyDto,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
    @Req() req: any
  ) {
    const imageUrls = files?.images?.map(file => file.path) || [];
    return this.propertiesService.create({ ...createPropertyDto, images: imageUrls }, req.user.userId);
  }

  @Get()
  async findAll(@Query() query: QueryPropertyDto) {
    return this.propertiesService.findAll(query);
  }

  @Get('owner/:ownerId')
  async findByOwner(@Param('ownerId') ownerId: string) {
    return this.propertiesService.findByOwner(ownerId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.DALALI, UserRole.ADMIN)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'images', maxCount: 10 },
  ]))
  async update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
    @Req() req: any
  ) {
    const imageUrls = files?.images?.map(file => file.path) || [];
    return this.propertiesService.update(
      id,
      { ...updatePropertyDto, images: imageUrls }
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.propertiesService.remove(id);
    return;
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.DALALI, UserRole.ADMIN)
  async setStatus(
    @Param('id') id: string,
    @Body('status') status: PropertyStatus,
    @Req() req: any
  ) {
    return this.propertiesService.setStatus(id, status);
  }

  @Get('search')
  async search(@Query() searchDto: SearchPropertyDto) {
    return this.propertiesService.search(searchDto);
  }

  @Post('search/save')
  @UseGuards(JwtAuthGuard)
  async saveSearch(@Body() saveSearchDto: SaveSearchDto, @Req() req: any) {
    return this.propertiesService.saveSearch(req.user.userId, saveSearchDto);
  }

  @Get('search/saved')
  @UseGuards(JwtAuthGuard)
  async getSavedSearches(@Req() req: any) {
    return this.propertiesService.getSavedSearches(req.user.userId);
  }

  @Delete('search/saved/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSavedSearch(@Param('id') id: string, @Req() req: any) {
    await this.propertiesService.deleteSavedSearch(id, req.user.userId);
  }

  @Patch('search/saved/:id')
  @UseGuards(JwtAuthGuard)
  async updateSavedSearch(
    @Param('id') id: string,
    @Body() updateData: Partial<SaveSearchDto>,
    @Req() req: any
  ) {
    return this.propertiesService.updateSavedSearch(id, req.user.userId, updateData);
  }
} 