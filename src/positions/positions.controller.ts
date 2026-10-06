import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PositionsService, RecordPositionDto } from './positions.service';
import { Position } from './position.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('positions')
@UseGuards(JwtAuthGuard)
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  /**
   * Le livreur enregistre sa position actuelle.
   * À appeler toutes les 5-10 secondes par l'app mobile.
   */
  @Post()
  record(
    @Request() req: any,
    @Body() body: RecordPositionDto,
  ): Promise<Position> {
    return this.positionsService.recordPosition(req.user.userId, body);
  }

  /**
   * Récupère la dernière position d'un livreur.
   * Utilisé par le client pour suivre son colis.
   */
  @Get('livreur/:livreurId/latest')
  getLatest(@Param('livreurId') livreurId: string): Promise<Position | null> {
    return this.positionsService.getLatestPosition(livreurId);
  }

  /**
   * Historique des positions d'un livreur sur X minutes.
   */
  @Get('livreur/:livreurId/history')
  getHistory(
    @Param('livreurId') livreurId: string,
    @Query('minutes') minutes?: string,
  ): Promise<Position[]> {
    const min = minutes ? Number(minutes) : 30;
    return this.positionsService.getHistory(livreurId, min);
  }

  /**
   * Récupère la dernière position de tous les livreurs actifs.
   * Utilisé pour afficher la carte globale (dashboard admin).
   */
  @Get('active')
  getActive(): Promise<Position[]> {
    return this.positionsService.getActivePositions();
  }

  /**
   * Récupère le trajet complet d'une livraison.
   * Utile pour rejouer le parcours d'un livreur.
   */
  @Get('delivery/:deliveryId/track')
  getDeliveryTrack(@Param('deliveryId') deliveryId: string): Promise<Position[]> {
    return this.positionsService.getDeliveryTrack(deliveryId);
  }

  /**
   * Statistiques des positions.
   */
  @Get('stats')
  getStats() {
    return this.positionsService.getStats();
  }

  /**
   * Nettoie les positions de plus de X heures (admin).
   */
  @Delete('cleanup')
  cleanup(@Query('hours') hours?: string) {
    const h = hours ? Number(hours) : 24;
    return this.positionsService.cleanupOldPositions(h);
  }
}
