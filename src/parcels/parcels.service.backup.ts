import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parcel, ParcelStatus, DeliveryType } from './parcel.entity';

@Injectable()
export class ParcelsService {
  constructor(
    @InjectRepository(Parcel)
    private parcelsRepository: Repository<Parcel>,
  ) {}

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
    const price = Math.round(basePrice + distanceKm * pricePerKm + weight * pricePerKg);

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
    });

    return this.parcelsRepository.save(parcel);
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
      throw new ForbiddenException('Vous n êtes pas assigné à ce colis');
    }
    parcel.status = ParcelStatus.PICKED_UP;
    parcel.pickedUpAt = new Date();
    return this.parcelsRepository.save(parcel);
  }

  async markDelivered(id: string, livreurId: string, otp: string): Promise<Parcel> {
    const parcel = await this.findOne(id);
    if (parcel.livreurId !== livreurId) {
      throw new ForbiddenException('Vous n êtes pas assigné à ce colis');
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
