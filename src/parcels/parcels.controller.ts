import {
  Controller, Get, Post, Body, Param, Patch,
  UseGuards, Request, Query,
} from '@nestjs/common';
import { ParcelsService } from './parcels.service';
import { Parcel } from './parcel.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('parcels')
@UseGuards(JwtAuthGuard)
export class ParcelsController {
  constructor(private readonly parcelsService: ParcelsService) {}

  /** 🆕 Estimer le prix SANS créer le colis */
  @Post('estimate')
  estimate(@Body() body: {
    pickupLat: number;
    pickupLng: number;
    deliveryLat: number;
    deliveryLng: number;
    weightKg?: number;
  }) {
    return this.parcelsService.estimate(body);
  }

  /** 🆕 Estimer le prix groupé */
  @Post('estimate-group')
  estimateGroup(@Body() body: {
    pickupLat: number;
    pickupLng: number;
    deliveryLat: number;
    deliveryLng: number;
    weightKg?: number;
    count: number;
  }) {
    return this.parcelsService.estimateGroup(body);
  }

  @Post()
  create(@Request() req: any, @Body() data: Partial<Parcel>): Promise<Parcel> {
    return this.parcelsService.create(req.user.userId, data);
  }

  @Get()
  findAll(): Promise<Parcel[]> {
    return this.parcelsService.findAll();
  }

  @Get('my-parcels')
  findMyParcels(@Request() req: any): Promise<Parcel[]> {
    return this.parcelsService.findByClient(req.user.userId);
  }

  @Get('available')
  findAvailable(): Promise<Parcel[]> {
    return this.parcelsService.findAvailableForLivreur();
  }

  @Post('calculate-group-price')
  calculateGroupPrice(@Body() body: { parcelIds: string[] }) {
    return this.parcelsService.calculateGroupedPrice(body.parcelIds);
  }

  @Post('apply-group-pricing')
  applyGroupPricing(@Body() body: { parcelIds: string[] }) {
    return this.parcelsService.applyGroupedPricing(body.parcelIds);
  }

  @Get(':id/groupable')
  findGroupable(@Param('id') id: string, @Query('radius') radius?: string) {
    return this.parcelsService.findGroupableParcels(
      id, radius ? Number(radius) : 3,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Parcel> {
    return this.parcelsService.findOne(id);
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string, @Request() req: any): Promise<Parcel> {
    return this.parcelsService.assignToLivreur(id, req.user.userId);
  }

  @Patch(':id/pickup')
  pickup(@Param('id') id: string, @Request() req: any): Promise<Parcel> {
    return this.parcelsService.markPickedUp(id, req.user.userId);
  }

  @Patch(':id/deliver')
  deliver(@Param('id') id: string, @Body() body: { otp: string }, @Request() req: any): Promise<Parcel> {
    return this.parcelsService.markDelivered(id, req.user.userId, body.otp);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Request() req: any): Promise<Parcel> {
    return this.parcelsService.cancel(id, req.user.userId);
  }
}
