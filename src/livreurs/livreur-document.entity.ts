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

export enum DocumentType {
  CNI_RECTO = 'cni_recto',
  CNI_VERSO = 'cni_verso',
  SELFIE = 'selfie',
  PHOTO_PROFIL = 'photo_profil',
  MOTO_PHOTO = 'moto_photo',
  MOTO_PLAQUE = 'moto_plaque',
  PERMIS = 'permis',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Entity('livreur_documents')
export class LivreurDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'livreurId' })
  livreur: User;

  @Column()
  livreurId: string;

  @Column({ type: 'enum', enum: DocumentType })
  type: DocumentType;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'enum', enum: VerificationStatus, default: VerificationStatus.PENDING })
  status: VerificationStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  verifiedBy: string;

  @Column({ nullable: true, type: 'timestamp' })
  verifiedAt: Date;

  // Informations complémentaires
  @Column({ nullable: true })
  numeroCni: string;

  @Column({ nullable: true })
  motoPlate: string;

  @Column({ nullable: true })
  motoBrand: string;

  @Column({ nullable: true })
  permisNumero: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
