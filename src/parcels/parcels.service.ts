import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Parcel, ParcelStatus, DeliveryType } from './parcel.entity';

@Injectable()
export class ParcelsService {
  constructor(
    @InjectRepository(Parcel)
    private parcelsRepository: Repository<Parcel>,
  ) {}

  /**
   * Crée un colis avec calcul automatique du prix solo.
   */
  async create(clientId: string, data: Partial<Parcel>): Promise<Parcel> {
    const reference = `SN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const distanceKm = this.haversine(
      Number(data.pickupLat),
      Number(data.pickupLng),
      Number(data.deliveryLat),
      Number(data.deliveryLng),
    );

    const weight = Number(data.weightKg) || 1;
    const basePrice = 500;
    const pricePerKm = 150;
    const pricePerKg = 50;

    const basePriceSolo = Math.round(basePrice + distanceKm * pricePerKm + weight * pricePerKg);

    const parcel = this.parcelsRepository.create({
      ...data,
      reference,
      clientId,
      price: basePriceSolo,
      commission: Math.round(basePriceSolo * 0.01),
      livreurEarning: basePriceSolo - Math.round(basePriceSolo * 0.01),
      deliveryOtp,
      status: ParcelStatus.PENDING,
      deliveryType: data.deliveryType || DeliveryType.DIRECT,
      allowGrouping: data.allowGrouping ?? false,
    });

    return this.parcelsRepository.save(parcel);
  }

  /**
   * ✅ FORMULE B1 — TARIFICATION GROUPÉE
   * 
   * Le prix du trajet = MAX des prix solo des colis groupés
   * (celui qui va le plus loin impose son prix).
   * 
   * Formule :
   *   Prix du trajet = max(prix solo des colis)
   *   Prime livreur  = N × 250 FCFA
   *   Prix total     = Prix du trajet + Prime
   *   Prix par client = Prix total ÷ N
   *   Commission     = 1% du prix total
   *   Gain livreur   = Prix total - Commission
   * 
   * Exemple avec 4 colis Pikine → Keur Massar :
   *   Prix du trajet = 1783 FCFA
   *   Prime = 4 × 250 = 1000 FCFA
   *   Total = 2783 FCFA
   *   Prix par client = 696 FCFA
   *   Gain livreur = 2755 FCFA
   */
  async calculateGroupedPrice(parcelIds: string[]): Promise<{
    tripPrice: number;
    prime: number;
    total: number;
    perClient: number;
    count: number;
    commission: number;
    livreurEarning: number;
    farthestParcelRef: string;
  }> {
    const parcels = await this.parcelsRepository.find({
      where: { id: In(parcelIds) },
    });

    if (parcels.length === 0) {
      throw new NotFoundException('Aucun colis trouvé');
    }

    // 1. Prix du trajet = MAX des prix solo
    // On identifie le colis le plus "loin/cher" qui impose son prix.
    const farthestParcel = parcels.reduce((max, p) =>
      Number(p.price) > Number(max.price) ? p : max,
    );
    const tripPrice = Number(farthestParcel.price);

    // 2. Prime motivation livreur : 250 FCFA × N
    const prime = parcels.length * 250;

    // 3. Prix total
    const total = tripPrice + prime;

    // 4. Prix par client
    const perClient = Math.round(total / parcels.length);

    // 5. Commission et gain livreur (sur le total, pas par client)
    const commission = Math.round(total * 0.01);
    const livreurEarning = total - commission;

    return {
      tripPrice,
      prime,
      total,
      perClient,
      count: parcels.length,
      commission,
      livreurEarning,
      farthestParcelRef: farthestParcel.reference,
    };
  }

  /**
   * Applique la formule B1 : met à jour les prix des colis.
   */
  async applyGroupedPricing(parcelIds: string[]): Promise<{
    parcels: Parcel[];
    pricing: any;
  }> {
    const pricing = await this.calculateGroupedPrice(parcelIds);

    const parcels = await this.parcelsRepository.find({
      where: { id: In(parcelIds) },
    });

    const groupId = `GROUP-${Date.now()}`;

    for (const parcel of parcels) {
      parcel.price = pricing.perClient;
      parcel.commission = Math.round(pricing.perClient * 0.01);
      parcel.livreurEarning = pricing.perClient - parcel.commission;
      parcel.deliveryType = DeliveryType.GROUPED;
      parcel.groupId = groupId;
      await this.parcelsRepository.save(parcel);
    }

    return { parcels, pricing };
  }

  async findAll(): Promise<Parcel[]> {
    return this.parcelsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findByClient(clientId: string): Promise<Parcel[]> {
    return this.parcelsRepository.find({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Parcel> {
    const parcel = await this.parcelsRepository.findOne({ where: { id } });
    if (!parcel) {
      throw new NotFoundException('Colis introuvable');
    }
    return parcel;
  }

  async findAvailableForLivreur(): Promise<Parcel[]> {
    return this.parcelsRepository.find({
      where: { status: ParcelStatus.PENDING },
      order: { createdAt: 'ASC' },
      take: 50,
    });
  }

  async findGroupableParcels(
    baseParcelId: string,
    radiusKm: number = 3,
  ): Promise<Parcel[]> {
    const baseParcel = await this.findOne(baseParcelId);

    const candidates = await this.parcelsRepository.find({
      where: {
        status: ParcelStatus.PENDING,
        allowGrouping: true,
      },
    });

    return candidates.filter((p) => {
      if (p.id === baseParcel.id) return false;

      const distanceToDelivery = this.haversine(
        Number(baseParcel.deliveryLat),
        Number(baseParcel.deliveryLng),
        Number(p.deliveryLat),
        Number(p.deliveryLng),
      );

      return distanceToDelivery <= radiusKm;
    });
  }

  async assignToLivreur(id: string, livreurId: string): Promise<Parcel> {
    const parcel = await this.findOne(id);
    if (parcel.status !== ParcelStatus.PENDING) {
      throw new ForbiddenException('Ce colis a déjà été assigné');
    }
    parcel.status = ParcelStatus.ASSIGNED;
    parcel.livreurId = livreurId;
    return this.parcelsRepository.save(parcel);
  }

  async markPickedUp(id: string, livreurId: string): Promise<Parcel> {
    const parcel = await this.findOne(id);
    if (parcel.livreurId !== livreurId) {
      throw new ForbiddenException('Vous n\'êtes pas assigné à ce colis');
    }
    parcel.status = ParcelStatus.PICKED_UP;
    parcel.pickedUpAt = new Date();
    return this.parcelsRepository.save(parcel);
  }

  async markDelivered(id: string, livreurId: string, otp: string): Promise<Parcel> {
    const parcel = await this.findOne(id);
    if (parcel.livreurId !== livreurId) {
      throw new ForbiddenException('Vous n\'êtes pas assigné à ce colis');
    }
    if (parcel.deliveryOtp !== otp) {
      throw new ForbiddenException('Code OTP incorrect');
    }
    parcel.status = ParcelStatus.DELIVERED;
    parcel.deliveredAt = new Date();
    return this.parcelsRepository.save(parcel);
  }

  async cancel(id: string, clientId: string): Promise<Parcel> {
    const parcel = await this.findOne(id);
    if (parcel.clientId !== clientId) {
      throw new ForbiddenException('Vous ne pouvez pas annuler ce colis');
    }
    if (parcel.status !== ParcelStatus.PENDING) {
      throw new ForbiddenException('Ce colis ne peut plus être annulé');
    }
    parcel.status = ParcelStatus.CANCELLED;
    return this.parcelsRepository.save(parcel);
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
