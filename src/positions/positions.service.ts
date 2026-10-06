import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Position } from './position.entity';

export interface RecordPositionDto {
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  deliveryId?: string;
  batteryLevel?: number;
}

@Injectable()
export class PositionsService {
  constructor(
    @InjectRepository(Position)
    private positionsRepository: Repository<Position>,
  ) {}

  /**
   * Enregistre la position d'un livreur.
   * Appelé toutes les 5-10 secondes par l'app mobile.
   */
  async recordPosition(
    livreurId: string,
    data: RecordPositionDto,
  ): Promise<Position> {
    const position = this.positionsRepository.create({
      livreurId,
      lat: data.lat,
      lng: data.lng,
      accuracy: data.accuracy,
      speed: data.speed,
      heading: data.heading,
      deliveryId: data.deliveryId,
      batteryLevel: data.batteryLevel,
      recordedAt: new Date(),
      isActive: true,
    });

    return this.positionsRepository.save(position);
  }

  /**
   * Récupère la dernière position connue d'un livreur.
   */
  async getLatestPosition(livreurId: string): Promise<Position | null> {
    return this.positionsRepository.findOne({
      where: { livreurId },
      order: { recordedAt: 'DESC' },
    });
  }

  /**
   * Récupère l'historique des positions d'un livreur
   * sur les X dernières minutes (par défaut 30 min).
   */
  async getHistory(
    livreurId: string,
    minutes: number = 30,
  ): Promise<Position[]> {
    const since = new Date(Date.now() - minutes * 60 * 1000);

    return this.positionsRepository.find({
      where: {
        livreurId,
        recordedAt: MoreThan(since),
      },
      order: { recordedAt: 'ASC' },
    });
  }

  /**
   * Récupère la dernière position de tous les livreurs actifs.
   * Utilisé par le dashboard admin et la carte globale.
   */
  async getActivePositions(): Promise<Position[]> {
    // Fenêtre : derniers 5 minutes
    const since = new Date(Date.now() - 5 * 60 * 1000);

    // Récupérer toutes les positions récentes
    const recentPositions = await this.positionsRepository.find({
      where: { recordedAt: MoreThan(since) },
      order: { recordedAt: 'DESC' },
    });

    // Garder la dernière position de chaque livreur
    const seenLivreurs = new Set<string>();
    const activePositions: Position[] = [];

    for (const pos of recentPositions) {
      if (!seenLivreurs.has(pos.livreurId)) {
        seenLivreurs.add(pos.livreurId);
        activePositions.push(pos);
      }
    }

    return activePositions;
  }

  /**
   * Récupère l'historique des positions pour une livraison donnée.
   * Utile pour reconstituer le trajet d'un livreur après la livraison.
   */
  async getDeliveryTrack(deliveryId: string): Promise<Position[]> {
    return this.positionsRepository.find({
      where: { deliveryId },
      order: { recordedAt: 'ASC' },
    });
  }

  /**
   * Nettoie les positions de plus de X heures (par défaut 24h).
   * À appeler périodiquement (cron job ou admin).
   */
  async cleanupOldPositions(hours: number = 24): Promise<{ deleted: number }> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    const result = await this.positionsRepository
      .createQueryBuilder()
      .delete()
      .from(Position)
      .where('recordedAt < :cutoff', { cutoff })
      .execute();

    return { deleted: result.affected || 0 };
  }

  /**
   * Statistiques : nombre de positions enregistrées.
   */
  async getStats(): Promise<{
    total: number;
    activeLivreurs: number;
    last24h: number;
  }> {
    const total = await this.positionsRepository.count();

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last24h = await this.positionsRepository.count({
      where: { recordedAt: MoreThan(since24h) },
    });

    const since5min = new Date(Date.now() - 5 * 60 * 1000);
    const active = await this.positionsRepository.find({
      where: { recordedAt: MoreThan(since5min) },
      select: ['livreurId'],
    });
    const uniqueLivreurs = new Set(active.map((p) => p.livreurId));

    return {
      total,
      activeLivreurs: uniqueLivreurs.size,
      last24h,
    };
  }
}
