import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location, LocationType } from './location.entity';
import { SENEGAL_LOCATIONS } from './seed/locations.data';

@Injectable()
export class LocationsService implements OnModuleInit {
  constructor(
    @InjectRepository(Location)
    private locationsRepository: Repository<Location>,
  ) {}

  /**
   * Au démarrage : injecte les lieux du Sénégal en base (une seule fois).
   */
  async onModuleInit() {
    try {
      const count = await this.locationsRepository.count();
      if (count === 0) {
        console.log('🌍 Injection des lieux du Sénégal...');
        await this.locationsRepository.save(SENEGAL_LOCATIONS);
        console.log(`✅ ${SENEGAL_LOCATIONS.length} lieux injectés`);
      } else {
        console.log(`✅ ${count} lieux déjà en base`);
      }
    } catch (err) {
      console.error('Erreur seed locations:', err.message);
    }
  }

  /**
   * Recherche un lieu par nom (partiel, insensible à la casse).
   * Utilisé par la reconnaissance vocale.
   */
  async search(query: string, limit: number = 10): Promise<Location[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = `%${query.trim().toLowerCase()}%`;

    return this.locationsRepository
      .createQueryBuilder('loc')
      .where('LOWER(loc.name) LIKE :q', { q: searchTerm })
      .orWhere('LOWER(loc.nameWolof) LIKE :q', { q: searchTerm })
      .orWhere('LOWER(loc.aliases) LIKE :q', { q: searchTerm })
      .orderBy(
        `CASE WHEN LOWER(loc.name) = :exact THEN 0 
              WHEN LOWER(loc.name) LIKE :start THEN 1 
              ELSE 2 END`,
        'ASC',
      )
      .setParameters({
        exact: query.trim().toLowerCase(),
        start: `${query.trim().toLowerCase()}%`,
      })
      .limit(limit)
      .getMany();
  }

  /**
   * Trouve le lieu le plus proche d'un point GPS (Haversine).
   */
  async findNearest(lat: number, lng: number, maxKm: number = 5): Promise<Location | null> {
    const all = await this.locationsRepository.find({ where: { isActive: true } });

    let nearest: Location | null = null;
    let minDist = Infinity;

    for (const loc of all) {
      const d = this.haversine(
        lat, lng,
        Number(loc.latitude), Number(loc.longitude),
      );
      if (d < minDist) {
        minDist = d;
        nearest = loc;
      }
    }

    if (nearest && minDist <= maxKm) {
      return nearest;
    }
    return null;
  }

  /**
   * Récupère un lieu par son code.
   */
  async findByCode(code: string): Promise<Location> {
    const loc = await this.locationsRepository.findOne({ where: { code } });
    if (!loc) throw new NotFoundException('Lieu introuvable');
    return loc;
  }

  /**
   * Liste tous les lieux actifs.
   */
  async findAll(): Promise<Location[]> {
    return this.locationsRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Liste les régions uniquement.
   */
  async findRegions(): Promise<Location[]> {
    return this.locationsRepository.find({
      where: { type: LocationType.REGION, isActive: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Liste les villes d'une région.
   */
  async findByRegion(region: string): Promise<Location[]> {
    return this.locationsRepository.find({
      where: { region, isActive: true },
      order: { name: 'ASC' },
    });
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
