import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Parcel, ParcelStatus, DeliveryType } from './parcel.entity';
import { PricingService } from './pricing.service';
import { Delivery } from '../deliveries/delivery.entity';

@Injectable()
export class ParcelsService {
  constructor(
    @InjectRepository(Parcel)
    private parcelsRepository: Repository<Parcel>,
    private pricingService: PricingService,
    @InjectRepository(Delivery)
    private deliveriesRepository: Repository<Delivery>,
  ) {}

  /** Estimation du prix (sans créer le colis) */
  async estimate(params: {
    pickupLat: number;
    pickupLng: number;
    deliveryLat: number;
    deliveryLng: number;
    weightKg?: number;
  }) {
    const distanceKm = this.pricingService.haversine(
      params.pickupLat, params.pickupLng,
      params.deliveryLat, params.deliveryLng,
    );
    const weight = params.weightKg || 1;
    const price = this.pricingService.calculatePrice(distanceKm, weight);
    const tier = this.pricingService.getTierInfo(distanceKm);

    return {
      distanceKm: Math.round(distanceKm * 100) / 100,
      weightKg: weight,
      price,
      tier,
      currency: 'FCFA',
    };
  }

  /** Estimation groupée (N colis) */
  async estimateGroup(params: {
    pickupLat: number;
    pickupLng: number;
    deliveryLat: number;
    deliveryLng: number;
    weightKg?: number;
    count: number;
  }) {
    const base = await this.estimate(params);
    const prime = params.count * 250;
    const total = base.price + prime;
    const perClient = Math.round(total / params.count);

    return {
      ...base,
      count: params.count,
      prime,
      totalGrouped: total,
      perClient,
      economy: base.price - perClient,
    };
  }

  /** Création d'un colis avec la nouvelle grille */
  async create(clientId: string, data: Partial<Parcel>): Promise<Parcel> {
    const reference = `SN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const distanceKm = this.pricingService.haversine(
      Number(data.pickupLat), Number(data.pickupLng),
      Number(data.deliveryLat), Number(data.deliveryLng),
    );
    const weight = Number(data.weightKg) || 1;
    const price = this.pricingService.calculatePrice(distanceKm, weight);
    const commission = Math.round(price * 0.01);
    const livreurEarning = price - commission;

    const parcel = this.parcelsRepository.create({
      ...data,
      reference,
      clientId,
      price,
      commission,
      livreurEarning,
      deliveryOtp,
      status: ParcelStatus.PENDING,
      deliveryType: data.deliveryType || DeliveryType.DIRECT,
      allowGrouping: data.allowGrouping ?? false,
    });

    return this.parcelsRepository.save(parcel);
  }

  /** Formule B1 — Calcul groupé */
  async calculateGroupedPrice(parcelIds: string[]) {
    const parcels = await this.parcelsRepository.find({
      where: { id: In(parcelIds) },
    });
    if (parcels.length === 0) throw new NotFoundException('Aucun colis trouvé');

    const farthestParcel = parcels.reduce((max, p) =>
      Number(p.price) > Number(max.price) ? p : max,
    );
    const tripPrice = Number(farthestParcel.price);
    const prime = parcels.length * 250;
    const total = tripPrice + prime;
    const perClient = Math.round(total / parcels.length);
    const commission = Math.round(total * 0.01);
    const livreurEarning = total - commission;

    return {
      tripPrice, prime, total, perClient,
      count: parcels.length,
      commission, livreurEarning,
      farthestParcelRef: farthestParcel.reference,
    };
  }

  async applyGroupedPricing(parcelIds: string[]) {
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
    if (!parcel) throw new NotFoundException('Colis introuvable');
    return parcel;
  }

  async findAvailableForLivreur(): Promise<Parcel[]> {
    return this.parcelsRepository.find({
      where: { status: ParcelStatus.PENDING },
      order: { createdAt: 'ASC' },
      take: 50,
    });
  }

  async findGroupableParcels(baseParcelId: string, radiusKm: number = 3): Promise<Parcel[]> {
    const baseParcel = await this.findOne(baseParcelId);
    const candidates = await this.parcelsRepository.find({
      where: { status: ParcelStatus.PENDING, allowGrouping: true },
    });

    return candidates.filter((p) => {
      if (p.id === baseParcel.id) return false;
      const distanceToDelivery = this.pricingService.haversine(
        Number(baseParcel.deliveryLat), Number(baseParcel.deliveryLng),
        Number(p.deliveryLat), Number(p.deliveryLng),
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
    const saved = await this.parcelsRepository.save(parcel);

    // Créer aussi une entrée Delivery pour le suivi
    try {
      const existing = await this.deliveriesRepository.findOne({ where: { parcelId: id } });
      if (!existing) {
        const delivery = this.deliveriesRepository.create({
          parcelId: id,
          livreurId,
          status: 'assigned' as any,
          assignedAt: new Date(),
          acceptedAt: new Date(),
          livreurEarning: parcel.livreurEarning,
          commission: parcel.commission,
        });
        await this.deliveriesRepository.save(delivery);
      }
    } catch (err) {
      console.error('Erreur création delivery:', err.message);
    }

    return saved;
  }

  async markPickedUp(id: string, livreurId: string): Promise<Parcel> {
    const parcel = await this.findOne(id);
    if (parcel.livreurId !== livreurId) throw new ForbiddenException('Non assigné');
    parcel.status = ParcelStatus.PICKED_UP;
    parcel.pickedUpAt = new Date();
    return this.parcelsRepository.save(parcel);
  }

  async markDelivered(id: string, livreurId: string, otp: string): Promise<Parcel> {
    const parcel = await this.findOne(id);
    if (parcel.livreurId !== livreurId) throw new ForbiddenException('Non assigné');
    if (parcel.deliveryOtp !== otp) throw new ForbiddenException('OTP incorrect');
    parcel.status = ParcelStatus.DELIVERED;
    parcel.deliveredAt = new Date();
    return this.parcelsRepository.save(parcel);
  }

  async cancel(id: string, clientId: string): Promise<Parcel> {
    const parcel = await this.findOne(id);
    if (parcel.clientId !== clientId) throw new ForbiddenException('Non autorisé');
    if (parcel.status !== ParcelStatus.PENDING) {
      throw new ForbiddenException('Ce colis ne peut plus être annulé');
    }
    parcel.status = ParcelStatus.CANCELLED;
    return this.parcelsRepository.save(parcel);
  }
}
