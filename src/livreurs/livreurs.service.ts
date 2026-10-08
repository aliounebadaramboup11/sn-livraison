import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LivreurDocument, DocumentType, VerificationStatus } from './livreur-document.entity';
import { User, UserStatus } from '../users/user.entity';

@Injectable()
export class LivreursService {
  constructor(
    @InjectRepository(LivreurDocument)
    private docsRepo: Repository<LivreurDocument>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  /** Sauvegarde un document uploadé */
  async saveDocument(
    livreurId: string,
    type: DocumentType,
    url: string,
    extra?: { numeroCni?: string; motoPlate?: string; motoBrand?: string; permisNumero?: string },
  ): Promise<LivreurDocument> {
    // Supprimer l'ancien document du même type s'il existe
    const existing = await this.docsRepo.findOne({ where: { livreurId, type } });
    if (existing) {
      existing.url = url;
      existing.status = VerificationStatus.PENDING;
      existing.rejectionReason = null;
      if (extra) Object.assign(existing, extra);
      return this.docsRepo.save(existing);
    }

    const doc = this.docsRepo.create({
      livreurId,
      type,
      url,
      status: VerificationStatus.PENDING,
      ...extra,
    });
    return this.docsRepo.save(doc);
  }

  /** Liste les documents d'un livreur */
  async findByLivreur(livreurId: string): Promise<LivreurDocument[]> {
    return this.docsRepo.find({
      where: { livreurId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Vérifie si un livreur a TOUS les documents obligatoires */
  async checkComplete(livreurId: string): Promise<{
    complete: boolean;
    missing: string[];
    pending: string[];
    verified: string[];
  }> {
    const requiredTypes = [
      DocumentType.CNI_RECTO,
      DocumentType.CNI_VERSO,
      DocumentType.SELFIE,
      DocumentType.PHOTO_PROFIL,
      DocumentType.MOTO_PHOTO,
      DocumentType.MOTO_PLAQUE,
      DocumentType.PERMIS,
    ];

    const docs = await this.findByLivreur(livreurId);
    const present = new Set(docs.map((d) => d.type));
    const missing = requiredTypes.filter((t) => !present.has(t));
    const pending = docs.filter((d) => d.status === VerificationStatus.PENDING).map((d) => d.type);
    const verified = docs.filter((d) => d.status === VerificationStatus.VERIFIED).map((d) => d.type);

    return {
      complete: missing.length === 0,
      missing,
      pending,
      verified,
    };
  }

  /** Valide un document (admin) */
  async verifyDocument(docId: string, adminId: string): Promise<LivreurDocument> {
    const doc = await this.docsRepo.findOne({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Document introuvable');

    doc.status = VerificationStatus.VERIFIED;
    doc.verifiedBy = adminId;
    doc.verifiedAt = new Date();
    return this.docsRepo.save(doc);
  }

  /** Rejette un document (admin) */
  async rejectDocument(docId: string, adminId: string, reason: string): Promise<LivreurDocument> {
    const doc = await this.docsRepo.findOne({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Document introuvable');

    doc.status = VerificationStatus.REJECTED;
    doc.rejectionReason = reason;
    doc.verifiedBy = adminId;
    doc.verifiedAt = new Date();
    return this.docsRepo.save(doc);
  }

  /** Active le compte livreur si TOUS les documents sont validés */
  async tryActivate(livreurId: string): Promise<{ activated: boolean; reason?: string }> {
    const check = await this.checkComplete(livreurId);

    if (!check.complete) {
      return { activated: false, reason: 'Documents manquants' };
    }
    if (check.pending.length > 0) {
      return { activated: false, reason: 'Documents en attente de validation' };
    }
    if (check.verified.length < 7) {
      return { activated: false, reason: 'Tous les documents doivent être validés' };
    }

    const user = await this.usersRepo.findOne({ where: { id: livreurId } });
    if (!user) throw new NotFoundException('Livreur introuvable');

    user.status = UserStatus.ACTIVE;
    await this.usersRepo.save(user);

    return { activated: true };
  }

  /** Liste des livreurs en attente de vérification (admin) */
  async findPendingLivreurs(): Promise<User[]> {
    return this.usersRepo.find({
      where: { role: 'livreur' as any, status: UserStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }
}
