import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Property } from '../../properties/entities/property.entity';

export enum ReviewType {
  PROPERTY = 'property',
  USER = 'user',
}

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ReviewType,
    enumName: 'review_type_enum',
  })
  type: ReviewType;

  @Column('int')
  rating: number;

  @Column('text')
  comment: string;

  @Column({ default: false })
  isVerified: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewerId' })
  reviewer: User;

  @Column()
  reviewerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedUserId' })
  reviewedUser: User;

  @Column({ nullable: true })
  reviewedUserId: string;

  @ManyToOne(() => Property, { nullable: true })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column({ nullable: true })
  propertyId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 