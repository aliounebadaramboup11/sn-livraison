import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { LivreursService } from './livreurs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('livreurs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LivreursController {
  constructor(private readonly livreursService: LivreursService) {}

  @Post('admin/create')
  @Roles(UserRole.ADMIN)
  async createLivreur(@Body() body: any) {
    return this.livreursService.createLivreur(body);
  }

  // MODIFIÉ : On transmet le livreurId au service
  @Post('documents')
  @Roles(UserRole.LIVREUR, UserRole.ADMIN)
  async uploadDocument(@Request() req, @Body() body: any) {
    return this.livreursService.saveDocument(req.user.userId, body.type, body.url, {
      livreurId: body.livreurId,
      numeroCni: body.numeroCni,
      permisNumero: body.permisNumero,
    });
  }

  @Get('me/documents')
  @Roles(UserRole.LIVREUR)
  async getMyDocuments(@Request() req) {
    return this.livreursService.findByLivreur(req.user.userId);
  }

  @Get('me/status')
  @Roles(UserRole.LIVREUR)
  async getMyStatus(@Request() req) {
    return this.livreursService.findByLivreur(req.user.userId);
  }

  @Get('admin/pending')
  @Roles(UserRole.ADMIN)
  async getPendingLivreurs() {
    return this.livreursService.findPendingLivreurs();
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  async getAllLivreurs() {
    return this.livreursService.findAllLivreurs();
  }

  @Get(':id/documents')
  @Roles(UserRole.ADMIN)
  async getDocuments(@Param('id') id: string) {
    return this.livreursService.findDocumentsByLivreur(id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async getLivreurById(@Param('id') id: string) {
    return this.livreursService.findByLivreur(id);
  }

  @Patch('documents/:id/verify')
  @Roles(UserRole.ADMIN)
  async verifyDocument(@Param('id') id: string, @Request() req) {
    return this.livreursService.verifyDocument(id, req.user.userId);
  }

  @Patch('documents/:id/reject')
  @Roles(UserRole.ADMIN)
  async rejectDocument(@Param('id') id: string, @Request() req, @Body() body: { reason: string }) {
    return this.livreursService.rejectDocument(id, req.user.userId, body.reason);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN)
  async activateLivreur(@Param('id') id: string) {
    return this.livreursService.tryActivate(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deleteLivreur(@Param('id') id: string) {
    return this.livreursService.deleteLivreur(id);
  }
}
