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
import { ReviewsService, CreateReviewDto } from './reviews.service';
import { Review } from './review.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * Créer un avis (client → livreur ou livreur → client).
   */
  @Post()
  create(
    @Request() req: any,
    @Body() body: CreateReviewDto,
  ): Promise<Review> {
    return this.reviewsService.create(req.user.userId, body);
  }

  /**
   * Mes avis donnés.
   */
  @Get('my-reviews')
  findMyReviews(@Request() req: any): Promise<Review[]> {
    return this.reviewsService.findByAuteur(req.user.userId);
  }

  /**
   * Avis reçus par un utilisateur (livreur ou client).
   */
  @Get('user/:userId')
  findByUser(@Param('userId') userId: string): Promise<Review[]> {
    return this.reviewsService.findByCible(userId);
  }

  /**
   * Statistiques d'un utilisateur (note moyenne, distribution).
   */
  @Get('user/:userId/stats')
  getUserStats(@Param('userId') userId: string) {
    return this.reviewsService.getStats(userId);
  }

  /**
   * Avis d'une livraison donnée.
   */
  @Get('delivery/:deliveryId')
  findByDelivery(@Param('deliveryId') deliveryId: string): Promise<Review[]> {
    return this.reviewsService.findByDelivery(deliveryId);
  }

  /**
   * Signaler un avis (modération).
   */
  @Patch(':id/flag')
  flag(@Param('id') id: string): Promise<Review> {
    return this.reviewsService.flagReview(id);
  }

  /**
   * Masquer un avis (admin).
   */
  @Patch(':id/hide')
  hide(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ): Promise<Review> {
    return this.reviewsService.hideReview(id, body.reason);
  }
}
