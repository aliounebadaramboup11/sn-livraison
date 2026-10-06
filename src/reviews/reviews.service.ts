import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, ReviewerRole } from './review.entity';
import { User } from '../users/user.entity';
import { Delivery, DeliveryStatus } from '../deliveries/delivery.entity';

export interface CreateReviewDto {
  deliveryId?: string;
  parcelId?: string;
  cibleId: string;
  cibleRole: ReviewerRole;
  rating: number;
  punctuality?: number;
  communication?: number;
  behavior?: number;
  care?: number;
  comment?: string;
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Delivery)
    private deliveriesRepository: Repository<Delivery>,
  ) {}

  /**
   * Crée un avis et met à jour la note moyenne de la cible.
   */
  async create(
    auteurId: string,
    data: CreateReviewDto,
  ): Promise<Review> {
    // Validation
    if (!data.rating || data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('La note doit être entre 1 et 5');
    }

    if (data.cibleId === auteurId) {
      throw new BadRequestException('Vous ne pouvez pas vous noter vous-même');
    }

    // Vérifier que la cible existe
    const cible = await this.usersRepository.findOne({
      where: { id: data.cibleId },
    });
    if (!cible) {
      throw new NotFoundException('Utilisateur cible introuvable');
    }

    // Vérifier la livraison si fournie
    if (data.deliveryId) {
      const delivery = await this.deliveriesRepository.findOne({
        where: { id: data.deliveryId },
      });
      if (!delivery) {
        throw new NotFoundException('Livraison introuvable');
      }
      if (delivery.status !== DeliveryStatus.DELIVERED) {
        throw new BadRequestException(
          'Vous ne pouvez noter qu\'après une livraison réussie',
        );
      }
    }

    // Déterminer le rôle de l'auteur
    const auteur = await this.usersRepository.findOne({
      where: { id: auteurId },
    });
    if (!auteur) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const auteurRole = auteur.role as any;

    // Empêcher les avis en double pour la même livraison
    if (data.deliveryId) {
      const existing = await this.reviewsRepository.findOne({
        where: {
          deliveryId: data.deliveryId,
          auteurId,
        },
      });
      if (existing) {
        throw new BadRequestException(
          'Vous avez déjà noté cette livraison',
        );
      }
    }

    // Créer l'avis
    const review = this.reviewsRepository.create({
      ...data,
      auteurId,
      auteurRole,
    });

    const saved = await this.reviewsRepository.save(review);

    // Mettre à jour la note moyenne de la cible
    await this.updateUserRating(data.cibleId);

    return saved;
  }

  /**
   * Récupère tous les avis d'un utilisateur (livreur ou client).
   */
  async findByCible(cibleId: string): Promise<Review[]> {
    return this.reviewsRepository.find({
      where: { cibleId, isHidden: false },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Récupère les avis laissés par un utilisateur.
   */
  async findByAuteur(auteurId: string): Promise<Review[]> {
    return this.reviewsRepository.find({
      where: { auteurId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Récupère l'avis d'une livraison spécifique.
   */
  async findByDelivery(deliveryId: string): Promise<Review[]> {
    return this.reviewsRepository.find({
      where: { deliveryId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Statistiques d'un livreur ou client :
   * note moyenne, nombre d'avis, distribution.
   */
  async getStats(cibleId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
    averages: {
      punctuality: number;
      communication: number;
      behavior: number;
      care: number;
    };
  }> {
    const reviews = await this.reviewsRepository.find({
      where: { cibleId, isHidden: false },
    });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        averages: { punctuality: 0, communication: 0, behavior: 0, care: 0 },
      };
    }

    // Distribution des notes
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[r.rating as 1 | 2 | 3 | 4 | 5]++;
      }
    });

    // Moyennes
    const averageRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    const avg = (field: keyof Review) => {
      const values = reviews
        .map((r) => r[field] as number)
        .filter((v) => v != null && !isNaN(v));
      return values.length > 0
        ? values.reduce((s, v) => s + v, 0) / values.length
        : 0;
    };

    return {
      averageRating: Math.round(averageRating * 100) / 100,
      totalReviews: reviews.length,
      distribution,
      averages: {
        punctuality: Math.round(avg('punctuality') * 100) / 100,
        communication: Math.round(avg('communication') * 100) / 100,
        behavior: Math.round(avg('behavior') * 100) / 100,
        care: Math.round(avg('care') * 100) / 100,
      },
    };
  }

  /**
   * Signale un avis (modération).
   */
  async flagReview(reviewId: string): Promise<Review> {
    const review = await this.reviewsRepository.findOne({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException('Avis introuvable');

    review.isFlagged = true;
    return this.reviewsRepository.save(review);
  }

  /**
   * Masque un avis (admin).
   */
  async hideReview(
    reviewId: string,
    reason: string,
  ): Promise<Review> {
    const review = await this.reviewsRepository.findOne({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException('Avis introuvable');

    review.isHidden = true;
    review.hiddenReason = reason;

    const saved = await this.reviewsRepository.save(review);
    await this.updateUserRating(review.cibleId);

    return saved;
  }

  /**
   * Recalcule la note moyenne d'un utilisateur.
   */
  private async updateUserRating(userId: string): Promise<void> {
    const stats = await this.getStats(userId);

    await this.usersRepository.update(userId, {
      rating: stats.averageRating,
    });
  }
}
