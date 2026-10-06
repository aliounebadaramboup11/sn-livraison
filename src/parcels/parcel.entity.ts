import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum ParcelStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum DeliveryType {
  DIRECT = 'direct',
  GROUPED = 'grouped',
  SCHEDULED = 'scheduled',
}

export enum ParcelCategory {
  DOCUMENT = 'document',
  SMALL_PACKAGE = 'small_package',
  MEDIUM_PACKAGE = 'medium_package',
  FOOD = 'food',
  ELECTRONICS = 'electronics',
  CLOTHING = 'clothing',
  OTHER = 'other',
}

@Entity('parcels')
export class Parcel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  reference: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column()
  clientId: string;

  // Départ
  @Column()
  pickupRegion: string;

  @Column()
  pickupCity: string;

  @Column({ nullable: true })
  pickupAddress: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  pickupLat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  pickupLng: number;

  @Column({ nullable: true })
  pickupContactName: string;

  @Column({ nullable: true })
  pickupContactPhone: string;

  @Column({ type: 'text', nullable: true })
  pickupLandmark: string;

  // Destination
  @Column()
  deliveryRegion: string;

  @Column()
  deliveryCity: string;

  @Column({ nullable: true })
  deliveryAddress: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  deliveryLat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  deliveryLng: number;

  @Column({ nullable: true })
  deliveryContactName: string;

  @Column({ nullable: true })
  deliveryContactPhone: string;

  @Column({ type: 'text', nullable: true })
  deliveryLandmark: string;

  // Colis
  @Column({ type: 'enum', enum: ParcelCategory, default: ParcelCategory.OTHER })
  category: ParcelCategory;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1 })
  weightKg: number;

  @Column({ nullable: true })
  dimensions: string;

  @Column({ default: false })
  isFragile: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  declaredValue: number;

  @Column({ nullable: true })
  photoUrl: string;

  // Type de livraison
  @Column({ type: 'enum', enum: DeliveryType, default: DeliveryType.DIRECT })
  deliveryType: DeliveryType;

  @Column({ type: 'enum', enum: ParcelStatus, default: ParcelStatus.PENDING })
  status: ParcelStatus;

  // Tarification
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  commission: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  livreurEarning: number;

  // Groupage
  @Column({ default: false })
  allowGrouping: boolean;

  @Column({ nullable: true })
  groupId: string;

  // Livraison
  @Column({ nullable: true })
  deliveryOtp: string;

  @Column({ nullable: true })
  livreurId: string;

  @Column({ nullable: true, type: 'timestamp' })
  scheduledAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  pickedUpAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  deliveredAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
