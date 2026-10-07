import { Injectable } from '@nestjs/common';

/**
 * Grille tarifaire intelligente Sama Livraison
 * 
 * Basée sur la distance réelle (Haversine) avec des paliers progressifs.
 * Référence validée : Pikine ↔ Keur Massar (8 km) = 2500 FCFA
 * 
 * Principe : plus la distance est grande, plus le prix/km est faible
 * (tarif "volume" attractif pour les longues distances).
 */
@Injectable()
export class PricingService {
  /**
   * Paliers tarifaires progressifs.
   * Chaque palier couvre une tranche de distance.
   */
  private readonly tiers = [
    { maxKm: 2, price: 1000 },
    { maxKm: 4, price: 1500 },
    { maxKm: 6, price: 2000 },
    { maxKm: 9, price: 2500 },   // ⭐ Pikine ↔ Keur Massar
    { maxKm: 13, price: 3200 },
    { maxKm: 20, price: 4500 },
    { maxKm: 35, price: 6500 },
    { maxKm: 70, price: 10000 },
    { maxKm: 150, price: 15000 },
    { maxKm: 300, price: 25000 },
  ];

  /**
   * Calcule le prix d'une livraison selon la distance.
   * 
   * @param distanceKm Distance en kilomètres (Haversine)
   * @param weightKg Poids du colis en kilogrammes
   * @returns Prix en FCFA
   */
  calculatePrice(distanceKm: number, weightKg: number = 1): number {
    // 1. Prix de base selon la distance
    let basePrice = 0;
    for (const tier of this.tiers) {
      if (distanceKm <= tier.maxKm) {
        basePrice = tier.price;
        break;
      }
    }

    // 2. Si au-delà du dernier palier → tarif minimum du dernier + extrapolation
    if (basePrice === 0) {
      const lastTier = this.tiers[this.tiers.length - 1];
      const extraKm = distanceKm - lastTier.maxKm;
      basePrice = lastTier.price + extraKm * 100; // +100 FCFA/km au-delà de 300 km
    }

    // 3. Ajustement selon le poids
    let weightSurcharge = 0;
    if (weightKg > 20) {
      weightSurcharge = 3000; // Sur devis en pratique, mais on met un plafond
    } else if (weightKg > 10) {
      weightSurcharge = 1500;
    } else if (weightKg > 5) {
      weightSurcharge = 500;
    }

    return Math.round(basePrice + weightSurcharge);
  }

  /**
   * Retourne le palier actuel pour debug/affichage.
   */
  getTierInfo(distanceKm: number) {
    for (let i = 0; i < this.tiers.length; i++) {
      if (distanceKm <= this.tiers[i].maxKm) {
        return {
          palier: i + 1,
          maxKm: this.tiers[i].maxKm,
          price: this.tiers[i].price,
        };
      }
    }
    return { palier: 'Hors grille', maxKm: null, price: null };
  }

  /**
   * Retourne tous les paliers (pour affichage client).
   */
  getAllTiers() {
    return this.tiers;
  }

  /**
   * Calcule la distance entre 2 points GPS (formule Haversine).
   */
  haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
