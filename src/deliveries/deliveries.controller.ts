import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { Delivery } from './delivery.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('deliveries')
@UseGuards(JwtAuthGuard)
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  /**
   * Le livreur accepte un colis (crée la livraison).
   */
  @Post('accept/:parcelId')
  accept(@Param('parcelId') parcelId: string, @Request() req: any): Promise<Delivery> {
    return this.deliveriesService.acceptDelivery(parcelId, req.user.userId);
  }

  /**
   * Le livreur indique qu'il est arrivé au point de récupération.
   */
  @Patch(':id/pickup-arrived')
  pickupArrived(
    @Param('id') id: string,
    @Body() body: { lat: number; lng: number },
    @Request() req: any,
  ): Promise<Delivery> {
    return this.deliveriesService.markPickupArrived(
      id,
      req.user.userId,
      body.lat,
      body.lng,
    );
  }

  /**
   * Le colis a été récupéré.
   */
  @Patch(':id/picked-up')
  pickedUp(@Param('id') id: string, @Request() req: any): Promise<Delivery> {
    return this.deliveriesService.markPickedUp(id, req.user.userId);
  }

  /**
   * En route vers la destination.
   */
  @Patch(':id/in-transit')
  inTransit(@Param('id') id: string, @Request() req: any): Promise<Delivery> {
    return this.deliveriesService.markInTransit(id, req.user.userId);
  }

  /**
   * Arrivé chez le client.
   */
  @Patch(':id/delivery-arrived')
  deliveryArrived(
    @Param('id') id: string,
    @Body() body: { lat: number; lng: number },
    @Request() req: any,
  ): Promise<Delivery> {
    return this.deliveriesService.markDeliveryArrived(
      id,
      req.user.userId,
      body.lat,
      body.lng,
    );
  }

  /**
   * Livraison validée avec OTP.
   */
  @Patch(':id/delivered')
  delivered(
    @Param('id') id: string,
    @Body() body: { otp: string },
    @Request() req: any,
  ): Promise<Delivery> {
    return this.deliveriesService.markDelivered(id, req.user.userId, body.otp);
  }

  /**
   * Livraison échouée.
   */
  @Patch(':id/failed')
  failed(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ): Promise<Delivery> {
    return this.deliveriesService.markFailed(id, req.user.userId, body.reason);
  }

  /**
   * Livraisons actives du livreur.
   */
  @Get('active')
  findActive(@Request() req: any): Promise<Delivery[]> {
    return this.deliveriesService.findActiveByLivreur(req.user.userId);
  }

  /**
   * Historique des livraisons du livreur.
   */
  @Get('my-history')
  findHistory(@Request() req: any): Promise<Delivery[]> {
    return this.deliveriesService.findByLivreur(req.user.userId);
  }

  /**
   * Suivi des livraisons d'un colis (côté client).
   */
  @Get('parcel/:parcelId')
  findByParcel(@Param('parcelId') parcelId: string): Promise<Delivery[]> {
    return this.deliveriesService.findByParcel(parcelId);
  }

  /**
   * Détail d'une livraison.
   */
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Delivery> {
    return this.deliveriesService.findOne(id);
  }
}
