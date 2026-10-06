import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parcel } from './parcel.entity';
import { ParcelsService } from './parcels.service';
import { ParcelsController } from './parcels.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Parcel])],
  providers: [ParcelsService],
  controllers: [ParcelsController],
  exports: [ParcelsService],
})
export class ParcelsModule {}
