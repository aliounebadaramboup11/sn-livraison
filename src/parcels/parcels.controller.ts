import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ParcelsService } from './parcels.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { ParcelStatus } from './parcel.entity';

@Controller('parcels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParcelsController {
  constructor(private readonly parcelsService: ParcelsService) {}

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  async getAllParcels() {
    return this.parcelsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async getParcelById(@Param('id') id: string) {
    return this.parcelsService.findById(id);
  }

  @Post('admin/create')
  @Roles(UserRole.ADMIN)
  async createParcel(@Body() body: any) {
    return this.parcelsService.create(body);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  async updateStatus(@Param('id') id: string, @Body() body: { status: ParcelStatus }) {
    return this.parcelsService.updateStatus(id, body.status);
  }

  @Patch(':id/assign')
  @Roles(UserRole.ADMIN)
  async assignLivreur(@Param('id') id: string, @Body() body: { livreurId: string }) {
    return this.parcelsService.assignLivreur(id, body.livreurId);
  }
}
