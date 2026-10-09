import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parcel, ParcelStatus } from './parcel.entity';

@Injectable()
export class ParcelsService {
  constructor(
    @InjectRepository(Parcel)
    private parcelsRepo: Repository<Parcel>,
  ) {}

  async findAll(): Promise<Parcel[]> {
    return this.parcelsRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Parcel> {
    const parcel = await this.parcelsRepo.findOne({ where: { id } });
    if (!parcel) throw new NotFoundException('Colis introuvable');
    return parcel;
  }

  async create(data: any): Promise<Parcel> {
    const parcel = this.parcelsRepo.create({
      trackingNumber: data.trackingNumber || `COL-${Date.now()}`,
      recipientName: data.recipientName,
      recipientPhone: data.recipientPhone,
      deliveryAddress: data.deliveryAddress,
      description: data.description,
      price: data.price || 0,
      status: ParcelStatus.PENDING,
      history: [{ status: ParcelStatus.PENDING, date: new Date(), note: 'Colis créé' }],
    });
    return this.parcelsRepo.save(parcel);
  }

  async updateStatus(id: string, status: ParcelStatus): Promise<Parcel> {
    const parcel = await this.findById(id);
    parcel.status = status;
    
    // On ajoute une entrée dans l'historique
    const history = parcel.history || [];
    history.push({ 
      status, 
      date: new Date(), 
      note: `Statut changé en "${status}"` 
    });
    parcel.history = history;
    
    return this.parcelsRepo.save(parcel);
  }

  async assignLivreur(id: string, livreurId: string): Promise<Parcel> {
    const parcel = await this.findById(id);
    parcel.livreurId = livreurId;
    parcel.status = ParcelStatus.PICKED_UP;
    
    const history = parcel.history || [];
    history.push({ 
      status: ParcelStatus.PICKED_UP, 
      date: new Date(), 
      note: `Assigné à un livreur` 
    });
    parcel.history = history;
    
    return this.parcelsRepo.save(parcel);
  }
}
