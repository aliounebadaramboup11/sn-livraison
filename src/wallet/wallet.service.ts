import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './wallet.entity';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from './transaction.entity';
import {
  Withdrawal,
  WithdrawalStatus,
  WithdrawalMethod,
} from './withdrawal.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletsRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(Withdrawal)
    private withdrawalsRepository: Repository<Withdrawal>,
  ) {}

  /**
   * Récupère ou crée le wallet d'un livreur.
   */
  async getOrCreateWallet(livreurId: string): Promise<Wallet> {
    let wallet = await this.walletsRepository.findOne({
      where: { livreurId },
    });

    if (!wallet) {
      wallet = this.walletsRepository.create({
        livreurId,
        balance: 0,
        pendingBalance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        totalCommission: 0,
        totalDeliveries: 0,
      });
      wallet = await this.walletsRepository.save(wallet);
    }

    return wallet;
  }

  /**
   * Crédite le wallet après une livraison réussie.
   * Appelé automatiquement par DeliveriesService.
   */
  async creditFromDelivery(
    livreurId: string,
    amount: number,
    commission: number,
    parcelId: string,
    deliveryId: string,
    reference: string,
  ): Promise<void> {
    const wallet = await this.getOrCreateWallet(livreurId);

    wallet.balance = Number(wallet.balance) + Number(amount);
    wallet.totalEarned = Number(wallet.totalEarned) + Number(amount);
    wallet.totalCommission = Number(wallet.totalCommission) + Number(commission);
    wallet.totalDeliveries = Number(wallet.totalDeliveries) + 1;

    await this.walletsRepository.save(wallet);

    // Enregistrer la transaction
    await this.transactionsRepository.save({
      userId: livreurId,
      type: TransactionType.DELIVERY_EARNING,
      status: TransactionStatus.COMPLETED,
      amount: amount,
      balanceAfter: wallet.balance,
      reference: reference,
      description: `Gain livraison ${reference}`,
      relatedParcelId: parcelId,
      relatedDeliveryId: deliveryId,
    });
  }

  /**
   * Débite le wallet pour un retrait.
   */
  async debit(
    livreurId: string,
    amount: number,
    type: TransactionType,
    description: string,
  ): Promise<Wallet> {
    const wallet = await this.getOrCreateWallet(livreurId);

    if (Number(wallet.balance) < Number(amount)) {
      throw new BadRequestException('Solde insuffisant');
    }

    wallet.balance = Number(wallet.balance) - Number(amount);
    await this.walletsRepository.save(wallet);

    await this.transactionsRepository.save({
      userId: livreurId,
      type,
      status: TransactionStatus.COMPLETED,
      amount: -amount,
      balanceAfter: wallet.balance,
      description,
    });

    return wallet;
  }

  /**
   * Récupère le wallet d'un livreur.
   */
  async getWallet(livreurId: string): Promise<Wallet> {
    return this.getOrCreateWallet(livreurId);
  }

  /**
   * Historique complet des transactions.
   */
  async getTransactions(livreurId: string, limit: number = 50): Promise<Transaction[]> {
    return this.transactionsRepository.find({
      where: { userId: livreurId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Crée une demande de retrait.
   */
  async requestWithdrawal(
    livreurId: string,
    method: WithdrawalMethod,
    beneficiaryPhone: string,
    amount: number,
    beneficiaryName?: string,
  ): Promise<Withdrawal> {
    if (amount <= 0) {
      throw new BadRequestException('Montant invalide');
    }

    if (amount < 1000) {
      throw new BadRequestException('Le montant minimum de retrait est de 1000 FCFA');
    }

    const wallet = await this.getOrCreateWallet(livreurId);

    if (Number(wallet.balance) < amount) {
      throw new BadRequestException(
        `Solde insuffisant. Disponible : ${wallet.balance} FCFA`,
      );
    }

    // Frais de retrait : 100 FCFA fixe
    const fees = 100;
    const netAmount = amount - fees;

    // Créer la demande de retrait
    const withdrawal = this.withdrawalsRepository.create({
      livreurId,
      method,
      beneficiaryPhone,
      beneficiaryName: beneficiaryName || null,
      amount,
      fees,
      netAmount,
      status: WithdrawalStatus.PENDING,
    });

    const savedWithdrawal = await this.withdrawalsRepository.save(withdrawal);

    // Bloquer l'argent (le déplacer vers pendingBalance)
    wallet.balance = Number(wallet.balance) - amount;
    wallet.pendingBalance = Number(wallet.pendingBalance) + amount;
    await this.walletsRepository.save(wallet);

    // Enregistrer la transaction
    await this.transactionsRepository.save({
      userId: livreurId,
      type: TransactionType.WITHDRAWAL,
      status: TransactionStatus.PENDING,
      amount: -amount,
      balanceAfter: wallet.balance,
      reference: savedWithdrawal.id,
      description: `Retrait ${method} vers ${beneficiaryPhone}`,
      relatedWithdrawalId: savedWithdrawal.id,
    });

    return savedWithdrawal;
  }

  /**
   * Liste les retraits d'un livreur.
   */
  async getWithdrawals(livreurId: string): Promise<Withdrawal[]> {
    return this.withdrawalsRepository.find({
      where: { livreurId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Liste tous les retraits en attente (admin).
   */
  async getPendingWithdrawals(): Promise<Withdrawal[]> {
    return this.withdrawalsRepository.find({
      where: { status: WithdrawalStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Approuve un retrait (admin) — l'argent est considéré comme envoyé.
   */
  async approveWithdrawal(withdrawalId: string): Promise<Withdrawal> {
    const withdrawal = await this.withdrawalsRepository.findOne({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new NotFoundException('Retrait introuvable');
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new ForbiddenException('Ce retrait a déjà été traité');
    }

    withdrawal.status = WithdrawalStatus.COMPLETED;
    withdrawal.processedAt = new Date();
    withdrawal.completedAt = new Date();

    const wallet = await this.getOrCreateWallet(withdrawal.livreurId);
    wallet.pendingBalance = Number(wallet.pendingBalance) - Number(withdrawal.amount);
    wallet.totalWithdrawn = Number(wallet.totalWithdrawn) + Number(withdrawal.amount);
    wallet.lastWithdrawalAt = new Date();
    await this.walletsRepository.save(wallet);

    // Marquer la transaction comme complétée
    const tx = await this.transactionsRepository.findOne({
      where: { relatedWithdrawalId: withdrawalId },
    });
    if (tx) {
      tx.status = TransactionStatus.COMPLETED;
      await this.transactionsRepository.save(tx);
    }

    return this.withdrawalsRepository.save(withdrawal);
  }

  /**
   * Rejette un retrait (admin) — l'argent est restitué au livreur.
   */
  async rejectWithdrawal(
    withdrawalId: string,
    reason: string,
  ): Promise<Withdrawal> {
    const withdrawal = await this.withdrawalsRepository.findOne({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new NotFoundException('Retrait introuvable');
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new ForbiddenException('Ce retrait a déjà été traité');
    }

    withdrawal.status = WithdrawalStatus.REJECTED;
    withdrawal.rejectionReason = reason;
    withdrawal.processedAt = new Date();

    // Restituer l'argent au wallet
    const wallet = await this.getOrCreateWallet(withdrawal.livreurId);
    wallet.balance = Number(wallet.balance) + Number(withdrawal.amount);
    wallet.pendingBalance = Number(wallet.pendingBalance) - Number(withdrawal.amount);
    await this.walletsRepository.save(wallet);

    // Marquer la transaction comme annulée
    const tx = await this.transactionsRepository.findOne({
      where: { relatedWithdrawalId: withdrawalId },
    });
    if (tx) {
      tx.status = TransactionStatus.CANCELLED;
      await this.transactionsRepository.save(tx);
    }

    return this.withdrawalsRepository.save(withdrawal);
  }

  /**
   * Statistiques détaillées du livreur.
   */
  async getStats(livreurId: string) {
    const wallet = await this.getOrCreateWallet(livreurId);

    return {
      balance: Number(wallet.balance),
      pendingBalance: Number(wallet.pendingBalance),
      totalEarned: Number(wallet.totalEarned),
      totalWithdrawn: Number(wallet.totalWithdrawn),
      totalCommission: Number(wallet.totalCommission),
      totalDeliveries: Number(wallet.totalDeliveries),
      isActive: wallet.isActive,
      lastWithdrawalAt: wallet.lastWithdrawalAt,
    };
  }
}
