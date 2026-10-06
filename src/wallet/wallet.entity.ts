import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'livreurId' })
  livreur: User;

  @Column({ unique: true })
  livreurId: string;

  // Solde disponible (FCFA)
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance: number;

  // Solde en attente (retraits en cours)
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  pendingBalance: number;

  // Statistiques cumulées
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalEarned: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalWithdrawn: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalCommission: number;

  @Column({ type: 'int', default: 0 })
  totalDeliveries: number;

  // Statut du portefeuille
  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastWithdrawalAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
