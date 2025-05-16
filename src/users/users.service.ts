import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getProfile(user: User): Promise<User> {
    return this.findOne(user.id);
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser: User): Promise<User> {
    if (currentUser.id !== id && currentUser.role !== 'admin') {
      throw new ForbiddenException('You can only update your own profile');
    }
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    if (currentUser.id !== id && currentUser.role !== 'admin') {
      throw new ForbiddenException('You can only delete your own account');
    }
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
} 