import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  INQUIRY_CREATED = 'inquiry_created',
  INQUIRY_RESPONDED = 'inquiry_responded',
  INQUIRY_STATUS_CHANGED = 'inquiry_status_changed',
  PROPERTY_STATUS_CHANGED = 'property_status_changed',
  PROPERTY_VIEWED = 'property_viewed',
  MESSAGE_RECEIVED = 'message_received',
  SYSTEM = 'system',
  DOCUMENT_UPLOADED = 'document_uploaded',
  DOCUMENT_STATUS_CHANGED = 'document_status_changed',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  REVIEW_RECEIVED = 'review_received',
  ROLE_UPDATED = 'role_updated',
  PROPERTY_DELETED = 'property_deleted',
  REVIEW_DELETED = 'review_deleted',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  data: string; // JSON string for additional data

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 