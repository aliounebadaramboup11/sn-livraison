import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

export enum ParcelStatus {
  PENDING = 'pending',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

@Entity('parcels')
export class Parcel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  trackingNumber: string;

  @Column()
  recipientName: string;

  @Column()
  recipientPhone: string;

  @Column()
  deliveryAddress: string;

  @Column({ type: 'enum', enum: ParcelStatus, default: ParcelStatus.PENDING })
  status: ParcelStatus;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  // NOUVEAU : Historique des statuts (stocké en JSON)
  @Column({ type: 'jsonb', default: [] })
  history: { status: string; date: Date; note?: string }[];

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'livreurId' })
  livreur: User;

  @Column({ nullable: true })
  livreurId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
