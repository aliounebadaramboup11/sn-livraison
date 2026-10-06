import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { Wallet } from './wallet.entity';
import { Transaction } from './transaction.entity';
import { Withdrawal, WithdrawalMethod } from './withdrawal.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  /**
   * Voir mon portefeuille (solde, stats).
   */
  @Get()
  getWallet(@Request() req: any): Promise<Wallet> {
    return this.walletService.getWallet(req.user.userId);
  }

  /**
   * Statistiques détaillées.
   */
  @Get('stats')
  getStats(@Request() req: any) {
    return this.walletService.getStats(req.user.userId);
  }

  /**
   * Historique des transactions.
   */
  @Get('transactions')
  getTransactions(
    @Request() req: any,
    @Query('limit') limit?: string,
  ): Promise<Transaction[]> {
    const lim = limit ? Number(limit) : 50;
    return this.walletService.getTransactions(req.user.userId, lim);
  }

  /**
   * Demander un retrait.
   */
  @Post('withdraw')
  requestWithdrawal(
    @Request() req: any,
    @Body()
    body: {
      method: WithdrawalMethod;
      beneficiaryPhone: string;
      amount: number;
      beneficiaryName?: string;
    },
  ): Promise<Withdrawal> {
    return this.walletService.requestWithdrawal(
      req.user.userId,
      body.method,
      body.beneficiaryPhone,
      body.amount,
      body.beneficiaryName,
    );
  }

  /**
   * Mes demandes de retrait.
   */
  @Get('withdrawals')
  getWithdrawals(@Request() req: any): Promise<Withdrawal[]> {
    return this.walletService.getWithdrawals(req.user.userId);
  }

  /**
   * Tous les retraits en attente (admin).
   */
  @Get('admin/pending-withdrawals')
  getPendingWithdrawals(): Promise<Withdrawal[]> {
    return this.walletService.getPendingWithdrawals();
  }

  /**
   * Approuver un retrait (admin).
   */
  @Patch('admin/withdrawals/:id/approve')
  approveWithdrawal(@Param('id') id: string): Promise<Withdrawal> {
    return this.walletService.approveWithdrawal(id);
  }

  /**
   * Rejeter un retrait (admin).
   */
  @Patch('admin/withdrawals/:id/reject')
  rejectWithdrawal(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ): Promise<Withdrawal> {
    return this.walletService.rejectWithdrawal(id, body.reason);
  }
}
