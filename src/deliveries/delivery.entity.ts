import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Parcel } from '../parcels/parcel.entity';
import { User } from '../users/user.entity';

export enum DeliveryStatus {
  ASSIGNED = 'assigned',
  ACCEPTED = 'accepted',
  PICKUP_ARRIVED = 'pickup_arrived',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERY_ARRIVED = 'delivery_arrived',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('deliveries')
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Parcel)
  @JoinColumn({ name: 'parcelId' })
  parcel: Parcel;

  @Column()
  parcelId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'livreurId' })
  livreur: User;

  @Column()
  livreurId: string;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.ASSIGNED,
  })
  status: DeliveryStatus;

  // Position de récupération (GPS au moment du pickup)
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  pickupLat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  pickupLng: number;

  // Position de livraison (GPS au moment de la livraison)
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  deliveryLat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  deliveryLng: number;

  // Photos de preuve
  @Column({ nullable: true })
  pickupPhotoUrl: string;

  @Column({ nullable: true })
  deliveryPhotoUrl: string;

  // Notes du livreur
  @Column({ type: 'text', nullable: true })
  notes: string;

  // Raison d'échec si la livraison n'aboutit pas
  @Column({ type: 'text', nullable: true })
  failureReason: string;

  // Distance et durée calculées
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  distanceKm: number;

  @Column({ type: 'int', nullable: true })
  estimatedDurationMin: number;

  // Montants (en FCFA)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  livreurEarning: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  commission: number;

  // Timestamps de suivi
  @Column({ nullable: true, type: 'timestamp' })
  assignedAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  acceptedAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  pickupArrivedAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  pickedUpAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  inTransitAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  deliveryArrivedAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  deliveredAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  failedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
