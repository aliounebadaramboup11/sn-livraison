import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../users/user.entity';
import { LivreurDocument, VerificationStatus, DocumentType } from './livreur-document.entity';

@Injectable()
export class LivreursService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(LivreurDocument)
    private docsRepo: Repository<LivreurDocument>,
  ) {}

  async createLivreur(data: any): Promise<User> {
    const existing = await this.usersRepo.findOne({ where: { phone: data.phone } });
    if (existing) throw new BadRequestException('Ce numéro de téléphone est déjà utilisé');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = this.usersRepo.create({
      phone: data.phone,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: UserRole.LIVREUR,
      status: UserStatus.PENDING,
      phoneVerified: true,
    });
    return this.usersRepo.save(user);
  }

  async deleteLivreur(livreurId: string): Promise<{ message: string }> {
    const user = await this.usersRepo.findOne({ where: { id: livreurId } });
    if (!user) throw new NotFoundException('Livreur introuvable');
    await this.docsRepo.delete({ livreurId: livreurId });
    await this.usersRepo.remove(user);
    return { message: 'Livreur supprimé avec succès.' };
  }

  // MODIFIÉ : Utilise l'ID du livreur fourni dans le corps de la requête
  async saveDocument(userId: string, type: string, url: string, extra: any): Promise<LivreurDocument> {
    const doc = new LivreurDocument();
    // Si un livreurId est fourni dans extra, on l'utilise, sinon on utilise l'ID de l'utilisateur connecté
    doc.livreurId = extra.livreurId || userId;
    doc.type = type as DocumentType;
    doc.url = url;
    doc.numeroCni = extra.numeroCni;
    doc.permisNumero = extra.permisNumero;
    return this.docsRepo.save(doc);
  }

  async findDocumentsByLivreur(livreurId: string): Promise<LivreurDocument[]> {
    return this.docsRepo.find({ 
      where: { livreurId: livreurId },
      order: { createdAt: 'DESC' }
    });
  }

  async findByLivreur(livreurId: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id: livreurId } });
  }

  async checkComplete(livreurId: string): Promise<any> {
    return { complete: true, pending: [], verified: [], missing: [] };
  }

  async verifyDocument(docId: string, adminId: string): Promise<LivreurDocument> {
    const doc = await this.docsRepo.findOne({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Document introuvable');
    doc.status = VerificationStatus.VERIFIED;
    doc.verifiedBy = adminId;
    doc.verifiedAt = new Date();
    const savedDoc = await this.docsRepo.save(doc);
    await this.checkAndActivateLivreur(doc.livreurId);
    return savedDoc;
  }

  private async checkAndActivateLivreur(livreurId: string): Promise<void> {
    const documents = await this.docsRepo.find({ where: { livreurId: livreurId } });
    if (documents.length < 7) return;
    const tousVerifies = documents.every(doc => doc.status === VerificationStatus.VERIFIED);
    if (tousVerifies) {
      const user = await this.usersRepo.findOne({ where: { id: livreurId } });
      if (user && user.status === UserStatus.PENDING) {
        user.status = UserStatus.ACTIVE;
        await this.usersRepo.save(user);
        console.log(`✅ Livreur ${user.firstName} ${user.lastName} activé automatiquement !`);
      }
    }
  }

  async rejectDocument(docId: string, adminId: string, reason: string): Promise<LivreurDocument> {
    const doc = await this.docsRepo.findOne({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Document introuvable');
    doc.status = VerificationStatus.REJECTED;
    doc.rejectionReason = reason;
    doc.verifiedBy = adminId;
    doc.verifiedAt = new Date();
    return this.docsRepo.save(doc);
  }

  async tryActivate(livreurId: string): Promise<{ activated: boolean; reason?: string }> {
    const user = await this.usersRepo.findOne({ where: { id: livreurId } });
    if (!user) throw new NotFoundException('Livreur introuvable');
    user.status = UserStatus.ACTIVE;
    await this.usersRepo.save(user);
    return { activated: true };
  }

  async findPendingLivreurs(): Promise<User[]> {
    return this.usersRepo.find({
      where: { role: UserRole.LIVREUR, status: UserStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }

  async findAllLivreurs(): Promise<User[]> {
    return this.usersRepo.find({
      where: { role: UserRole.LIVREUR },
      order: { createdAt: 'DESC' },
    });
  }
}
