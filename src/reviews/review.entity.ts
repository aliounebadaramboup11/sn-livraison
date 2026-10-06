import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Delivery } from '../deliveries/delivery.entity';
import { Parcel } from '../parcels/parcel.entity';

export enum ReviewerRole {
  CLIENT = 'client',
  LIVREUR = 'livreur',
}

@Entity('reviews')
@Index(['cibleId', 'createdAt'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Delivery, { nullable: true })
  @JoinColumn({ name: 'deliveryId' })
  delivery: Delivery;

  @Column({ nullable: true })
  deliveryId: string;

  @ManyToOne(() => Parcel, { nullable: true })
  @JoinColumn({ name: 'parcelId' })
  parcel: Parcel;

  @Column({ nullable: true })
  parcelId: string;

  // Auteur de l'avis
  @ManyToOne(() => User)
  @JoinColumn({ name: 'auteurId' })
  auteur: User;

  @Column()
  auteurId: string;

  @Column({ type: 'enum', enum: ReviewerRole })
  auteurRole: ReviewerRole;

  // Cible de l'avis (client ou livreur)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'cibleId' })
  cible: User;

  @Column()
  @Index()
  cibleId: string;

  @Column({ type: 'enum', enum: ReviewerRole })
  cibleRole: ReviewerRole;

  // Note globale (1-5)
  @Column({ type: 'int' })
  rating: number;

  // Critères détaillés (1-5)
  @Column({ type: 'int', nullable: true })
  punctuality: number; // Ponctualité

  @Column({ type: 'int', nullable: true })
  communication: number; // Communication

  @Column({ type: 'int', nullable: true })
  behavior: number; // Comportement / Respect

  @Column({ type: 'int', nullable: true })
  care: number; // Soin du colis

  // Commentaire
  @Column({ type: 'text', nullable: true })
  comment: string;

  // Modération
  @Column({ default: false })
  isFlagged: boolean;

  @Column({ default: false })
  isHidden: boolean;

  @Column({ type: 'text', nullable: true })
  hiddenReason: string;

  @CreateDateColumn()
  createdAt: Date;
}
