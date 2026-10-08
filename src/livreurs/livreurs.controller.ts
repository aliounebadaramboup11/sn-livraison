import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LivreursService } from './livreurs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DocumentType } from './livreur-document.entity';

@Controller('livreurs')
@UseGuards(JwtAuthGuard)
export class LivreursController {
  constructor(private readonly livreursService: LivreursService) {}

  @Post('documents')
  saveDocument(
    @Request() req: any,
    @Body() body: { type: DocumentType; url: string; numeroCni?: string; motoPlate?: string; motoBrand?: string; permisNumero?: string },
  ) {
    return this.livreursService.saveDocument(req.user.userId, body.type, body.url, {
      numeroCni: body.numeroCni,
      motoPlate: body.motoPlate,
      motoBrand: body.motoBrand,
      permisNumero: body.permisNumero,
    });
  }

  @Get('me/documents')
  myDocuments(@Request() req: any) {
    return this.livreursService.findByLivreur(req.user.userId);
  }

  @Get('me/status')
  myStatus(@Request() req: any) {
    return this.livreursService.checkComplete(req.user.userId);
  }

  @Get('admin/pending')
  pending() {
    return this.livreursService.findPendingLivreurs();
  }

  @Get(':id/documents')
  documentsOf(@Param('id') id: string) {
    return this.livreursService.findByLivreur(id);
  }

  @Patch('documents/:id/verify')
  verify(@Param('id') id: string, @Request() req: any) {
    return this.livreursService.verifyDocument(id, req.user.userId);
  }

  @Patch('documents/:id/reject')
  reject(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ) {
    return this.livreursService.rejectDocument(id, req.user.userId, body.reason);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.livreursService.tryActivate(id);
  }
}
