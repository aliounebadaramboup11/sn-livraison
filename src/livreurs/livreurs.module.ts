import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LivreurDocument } from './livreur-document.entity';
import { User } from '../users/user.entity';
import { LivreursService } from './livreurs.service';
import { LivreursController } from './livreurs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LivreurDocument, User])],
  providers: [LivreursService],
  controllers: [LivreursController],
  exports: [LivreursService],
})
export class LivreursModule {}
