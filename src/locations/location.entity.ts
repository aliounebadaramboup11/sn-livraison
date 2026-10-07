import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum LocationType {
  REGION = 'region',
  DEPARTMENT = 'department',
  CITY = 'city',
  QUARTER = 'quarter',
  LANDMARK = 'landmark',
}

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  @Index()
  name: string;

  @Column({ nullable: true })
  nameWolof: string;

  @Column({ type: 'enum', enum: LocationType, default: LocationType.CITY })
  @Index()
  type: LocationType;

  @Column()
  region: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  parentCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'text', nullable: true })
  aliases: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
