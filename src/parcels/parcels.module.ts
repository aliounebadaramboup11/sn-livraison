import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parcel } from './parcel.entity';
import { Delivery } from '../deliveries/delivery.entity';
import { ParcelsService } from './parcels.service';
import { ParcelsController } from './parcels.controller';
import { PricingService } from './pricing.service';

@Module({
  imports: [TypeOrmModule.forFeature([Parcel, Delivery])],
  providers: [ParcelsService, PricingService],
  controllers: [ParcelsController],
  exports: [ParcelsService, PricingService],
})
export class ParcelsModule {}
