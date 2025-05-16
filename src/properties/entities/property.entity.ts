import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Inquiry } from '../../inquiries/entities/inquiry.entity';
import { PropertyView } from './property-view.entity';

export enum PropertyType {
  HOUSE = 'house',
  APARTMENT = 'apartment',
  LAND = 'land',
  COMMERCIAL = 'commercial',
}

export enum PropertyStatus {
  AVAILABLE = 'available',
  RENTED = 'rented',
  SOLD = 'sold',
  PENDING = 'pending',
}

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: PropertyType,
    enumName: 'property_type_enum'
  })
  type: PropertyType;

  @Column({
    type: 'enum',
    enum: PropertyStatus,
    enumName: 'property_status_enum',
    default: PropertyStatus.AVAILABLE,
  })
  status: PropertyStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  location: string;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column('int')
  bedrooms: number;

  @Column('int')
  bathrooms: number;

  @Column('decimal', { precision: 10, scale: 2 })
  area: number;

  @Column('text', { array: true, transformer: {
    to: (value: string[]) => value,
    from: (value: any) => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') return value.split(',');
      return [];
    },
  }})
  features: string[];

  @Column('text', { array: true, nullable: true, transformer: {
    to: (value: string[]) => value,
    from: (value: any) => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') return value.split(',');
      return [];
    },
  }})
  images: string[];

  @ManyToOne(() => User, user => user.properties, { lazy: true })
  owner: Promise<User>;

  @Column()
  ownerId: string;

  @Column({ nullable: true })
  dalaliId: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Inquiry, inquiry => inquiry.property, { lazy: true })
  inquiries: Promise<Inquiry[]>;

  @OneToMany(() => PropertyView, view => view.property, { lazy: true })
  views: Promise<PropertyView[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 