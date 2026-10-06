import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  CLIENT = 'client',
  LIVREUR = 'livreur',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  BLOCKED = 'blocked',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CLIENT })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ nullable: true })
  profilePhoto: string;

  @Column({ default: false })
  phoneVerified: boolean;

  @Column({ nullable: true })
  otpCode: string;

  @Column({ nullable: true, type: 'timestamp' })
  otpExpiresAt: Date;

  @Column({ nullable: true })
  idCardNumber: string;

  @Column({ nullable: true })
  drivingLicense: string;

  @Column({ nullable: true })
  motoPlate: string;

  @Column({ nullable: true })
  motoBrand: string;

  @Column({ default: 5 })
  maxParcels: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 30 })
  maxWeightKg: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  totalDeliveries: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
