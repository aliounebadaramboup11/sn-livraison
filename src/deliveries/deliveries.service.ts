import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery, DeliveryStatus } from './delivery.entity';
import { Parcel, ParcelStatus } from '../parcels/parcel.entity';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private deliveriesRepository: Repository<Delivery>,
    @InjectRepository(Parcel)
    private parcelsRepository: Repository<Parcel>,
    private walletService: WalletService,
  ) {}

  async acceptDelivery(
    parcelId: string,
    livreurId: string,
  ): Promise<Delivery> {
    const parcel = await this.parcelsRepository.findOne({
      where: { id: parcelId },
    });

    if (!parcel) {
      throw new NotFoundException('Colis introuvable');
    }

    if (parcel.status !== ParcelStatus.PENDING) {
      throw new ForbiddenException('Ce colis a déjà été pris en charge');
    }

    parcel.status = ParcelStatus.ASSIGNED;
    parcel.livreurId = livreurId;
    await this.parcelsRepository.save(parcel);

    const delivery = this.deliveriesRepository.create({
      parcelId,
      livreurId,
      status: DeliveryStatus.ACCEPTED,
      assignedAt: new Date(),
      acceptedAt: new Date(),
      livreurEarning: parcel.livreurEarning,
      commission: parcel.commission,
    });

    return this.deliveriesRepository.save(delivery);
  }

  async markPickupArrived(
    deliveryId: string,
    livreurId: string,
    lat: number,
    lng: number,
  ): Promise<Delivery> {
    const delivery = await this.findDeliveryForLivreur(deliveryId, livreurId);

    delivery.status = DeliveryStatus.PICKUP_ARRIVED;
    delivery.pickupLat = lat;
    delivery.pickupLng = lng;
    delivery.pickupArrivedAt = new Date();

    return this.deliveriesRepository.save(delivery);
  }

  async markPickedUp(deliveryId: string, livreurId: string): Promise<Delivery> {
    const delivery = await this.findDeliveryForLivreur(deliveryId, livreurId);

    delivery.status = DeliveryStatus.PICKED_UP;
    delivery.pickedUpAt = new Date();

    await this.updateParcelStatus(delivery.parcelId, ParcelStatus.PICKED_UP);

    return this.deliveriesRepository.save(delivery);
  }

  async markInTransit(deliveryId: string, livreurId: string): Promise<Delivery> {
    const delivery = await this.findDeliveryForLivreur(deliveryId, livreurId);

    delivery.status = DeliveryStatus.IN_TRANSIT;
    delivery.inTransitAt = new Date();

    await this.updateParcelStatus(delivery.parcelId, ParcelStatus.IN_TRANSIT);

    return this.deliveriesRepository.save(delivery);
  }

  async markDeliveryArrived(
    deliveryId: string,
    livreurId: string,
    lat: number,
    lng: number,
  ): Promise<Delivery> {
    const delivery = await this.findDeliveryForLivreur(deliveryId, livreurId);

    delivery.status = DeliveryStatus.DELIVERY_ARRIVED;
    delivery.deliveryLat = lat;
    delivery.deliveryLng = lng;
    delivery.deliveryArrivedAt = new Date();

    return this.deliveriesRepository.save(delivery);
  }

  /**
   * Confirmation finale avec OTP.
   * ⭐ Crédite automatiquement le wallet du livreur.
   */
  async markDelivered(
    deliveryId: string,
    livreurId: string,
    otp: string,
  ): Promise<Delivery> {
    const delivery = await this.findDeliveryForLivreur(deliveryId, livreurId);

    const parcel = await this.parcelsRepository.findOne({
      where: { id: delivery.parcelId },
    });

    if (!parcel) {
      throw new NotFoundException('Colis introuvable');
    }

    if (parcel.deliveryOtp !== otp) {
      throw new BadRequestException('Code OTP incorrect');
    }

    delivery.status = DeliveryStatus.DELIVERED;
    delivery.deliveredAt = new Date();

    await this.updateParcelStatus(delivery.parcelId, ParcelStatus.DELIVERED, true);

    const savedDelivery = await this.deliveriesRepository.save(delivery);

    // ⭐ Créditer le wallet du livreur (montant + commission + référence)
    try {
      await this.walletService.creditFromDelivery(
        livreurId,
        Number(savedDelivery.livreurEarning),
        Number(savedDelivery.commission),
        savedDelivery.parcelId,
        savedDelivery.id,
        parcel.reference,
      );
    } catch (err) {
      console.error('Erreur crédit wallet :', err);
      // On ne bloque pas la livraison si le wallet échoue
    }

    return savedDelivery;
  }

  async markFailed(
    deliveryId: string,
    livreurId: string,
    reason: string,
  ): Promise<Delivery> {
    const delivery = await this.findDeliveryForLivreur(deliveryId, livreurId);

    delivery.status = DeliveryStatus.FAILED;
    delivery.failureReason = reason;
    delivery.failedAt = new Date();

    return this.deliveriesRepository.save(delivery);
  }

  async findByLivreur(livreurId: string): Promise<Delivery[]> {
    return this.deliveriesRepository.find({
      where: { livreurId },
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveByLivreur(livreurId: string): Promise<Delivery[]> {
    return this.deliveriesRepository.find({
      where: [
        { livreurId, status: DeliveryStatus.ACCEPTED },
        { livreurId, status: DeliveryStatus.PICKUP_ARRIVED },
        { livreurId, status: DeliveryStatus.PICKED_UP },
        { livreurId, status: DeliveryStatus.IN_TRANSIT },
        { livreurId, status: DeliveryStatus.DELIVERY_ARRIVED },
      ],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(deliveryId: string): Promise<Delivery> {
    const delivery = await this.deliveriesRepository.findOne({
      where: { id: deliveryId },
    });
    if (!delivery) {
      throw new NotFoundException('Livraison introuvable');
    }
    return delivery;
  }

  async findByParcel(parcelId: string): Promise<Delivery[]> {
    return this.deliveriesRepository.find({
      where: { parcelId },
      order: { createdAt: 'DESC' },
    });
  }

  private async findDeliveryForLivreur(
    deliveryId: string,
    livreurId: string,
  ): Promise<Delivery> {
    const delivery = await this.deliveriesRepository.findOne({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new NotFoundException('Livraison introuvable');
    }

    if (delivery.livreurId !== livreurId) {
      throw new ForbiddenException(
        'Vous n\'êtes pas assigné à cette livraison',
      );
    }

    return delivery;
  }

  private async updateParcelStatus(
    parcelId: string,
    status: ParcelStatus,
    markDeliveredAt: boolean = false,
  ): Promise<void> {
    const parcel = await this.parcelsRepository.findOne({
      where: { id: parcelId },
    });
    if (!parcel) return;

    parcel.status = status;

    if (status === ParcelStatus.PICKED_UP) {
      parcel.pickedUpAt = new Date();
    }

    if (markDeliveredAt) {
      parcel.deliveredAt = new Date();
    }

    await this.parcelsRepository.save(parcel);
  }
}
