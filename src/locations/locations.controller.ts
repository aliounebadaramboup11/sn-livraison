import {
  Controller, Get, Query, Param, UseGuards,
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { Location } from './location.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('locations')
@UseGuards(JwtAuthGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  /** Recherche un lieu par nom (vocal) */
  @Get('search')
  search(@Query('q') q: string, @Query('limit') limit?: string): Promise<Location[]> {
    return this.locationsService.search(q, limit ? Number(limit) : 10);
  }

  /** Trouve le lieu le plus proche d'un GPS */
  @Get('nearest')
  nearest(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('maxKm') maxKm?: string,
  ): Promise<Location | null> {
    return this.locationsService.findNearest(
      Number(lat),
      Number(lng),
      maxKm ? Number(maxKm) : 5,
    );
  }

  /** Toutes les régions du Sénégal */
  @Get('regions')
  regions(): Promise<Location[]> {
    return this.locationsService.findRegions();
  }

  /** Villes d'une région */
  @Get('region/:region')
  byRegion(@Param('region') region: string): Promise<Location[]> {
    return this.locationsService.findByRegion(region);
  }

  /** Tous les lieux actifs */
  @Get()
  findAll(): Promise<Location[]> {
    return this.locationsService.findAll();
  }

  /** Un lieu par code */
  @Get(':code')
  findByCode(@Param('code') code: string): Promise<Location> {
    return this.locationsService.findByCode(code);
  }
}
