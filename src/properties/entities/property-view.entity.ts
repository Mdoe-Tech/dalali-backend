import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Property } from './property.entity';
import { User } from '../../users/entities/user.entity';

@Entity('property_views')
export class PropertyView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'propertyId' })
  propertyId: string;

  @Column({ name: 'userId', nullable: true })
  userId: string;

  @Column({ name: 'ipAddress', nullable: true })
  ipAddress: string;

  @Column({ name: 'userAgent', nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @ManyToOne(() => Property, property => property.views, { lazy: true })
  property: Promise<Property>;

  @ManyToOne(() => User, { nullable: true, lazy: true })
  user: Promise<User>;
} 