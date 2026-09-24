import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  CreditAccount,
  CreditTransaction,
  Invoice,
  Organization,
} from '../database/entities';

@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(CreditAccount)
    private readonly accountRepo: Repository<CreditAccount>,
    @InjectRepository(CreditTransaction)
    private readonly txRepo: Repository<CreditTransaction>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    private readonly dataSource: DataSource,
  ) {}

  async getAccount(organizationId: string): Promise<CreditAccount> {
    let account = await this.accountRepo.findOne({ where: { organizationId } });
    if (!account) {
      account = this.accountRepo.create({
        organizationId,
        balance: 214,
        reservedBalance: 0,
      });
      account = await this.accountRepo.save(account);
    }
    return account;
  }

  async getBalance(organizationId: string): Promise<{
    balance: number;
    reservedBalance: number;
    availableBalance: number;
    monthlyLimit: number;
    resetDays: number;
  }> {
    const account = await this.getAccount(organizationId);
    const org = await this.orgRepo.findOne({ where: { id: organizationId } });
    const tier = org?.tier || 'Pro';

    const limits: Record<string, number> = {
      'Free Trial': 4,
      Starter: 100,
      Pro: 350,
      Agency: 1000,
    };

    return {
      balance: account.balance,
      reservedBalance: account.reservedBalance,
      availableBalance: Math.max(0, account.balance - account.reservedBalance),
      monthlyLimit: limits[tier] || 350,
      resetDays: 12,
    };
  }

  async reserveCredits(
    organizationId: string,
    amount: number,
    referenceId?: string,
  ): Promise<CreditAccount> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let account = await queryRunner.manager.findOne(CreditAccount, {
        where: { organizationId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!account) {
        account = queryRunner.manager.create(CreditAccount, {
          organizationId,
          balance: 214,
          reservedBalance: 0,
        });
        await queryRunner.manager.save(account);
      }

      const available = account.balance - account.reservedBalance;
      if (available < amount) {
        throw new BadRequestException(
          `Insufficient credits. Required: ${amount}, Available: ${available} (Total: ${account.balance}, Reserved: ${account.reservedBalance})`,
        );
      }

      account.reservedBalance += amount;
      account.version += 1;
      await queryRunner.manager.save(account);

      const tx = queryRunner.manager.create(CreditTransaction, {
        accountId: account.id,
        amount: -amount,
        balanceAfter: account.balance - account.reservedBalance,
        type: 'RESERVE',
        description: `Reserved ${amount} credits for generation job`,
        referenceId,
      });
      await queryRunner.manager.save(tx);

      await queryRunner.commitTransaction();
      return account;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async commitReservation(
    organizationId: string,
    amount: number,
    referenceId?: string,
    description = 'Consumed credits for completed creative variants',
  ): Promise<CreditAccount> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const account = await queryRunner.manager.findOne(CreditAccount, {
        where: { organizationId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!account) {
        throw new NotFoundException('Credit account not found.');
      }

      account.balance = Math.max(0, account.balance - amount);
      account.reservedBalance = Math.max(0, account.reservedBalance - amount);
      account.version += 1;
      await queryRunner.manager.save(account);

      const tx = queryRunner.manager.create(CreditTransaction, {
        accountId: account.id,
        amount: -amount,
        balanceAfter: account.balance,
        type: 'CONSUME',
        description,
        referenceId,
      });
      await queryRunner.manager.save(tx);

      await queryRunner.commitTransaction();
      return account;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async rollbackReservation(
    organizationId: string,
    amount: number,
    referenceId?: string,
  ): Promise<CreditAccount> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const account = await queryRunner.manager.findOne(CreditAccount, {
        where: { organizationId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!account) {
        throw new NotFoundException('Credit account not found.');
      }

      account.reservedBalance = Math.max(0, account.reservedBalance - amount);
      account.version += 1;
      await queryRunner.manager.save(account);

      const tx = queryRunner.manager.create(CreditTransaction, {
        accountId: account.id,
        amount,
        balanceAfter: account.balance - account.reservedBalance,
        type: 'RELEASE',
        description: `Released ${amount} reserved credits`,
        referenceId,
      });
      await queryRunner.manager.save(tx);

      await queryRunner.commitTransaction();
      return account;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async topUp(
    organizationId: string,
    amount: number,
    costCents = 1500,
  ): Promise<{ account: CreditAccount; invoice: Invoice }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let account = await queryRunner.manager.findOne(CreditAccount, {
        where: { organizationId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!account) {
        account = queryRunner.manager.create(CreditAccount, {
          organizationId,
          balance: 214,
          reservedBalance: 0,
        });
      }

      account.balance += amount;
      account.version += 1;
      await queryRunner.manager.save(account);

      const tx = queryRunner.manager.create(CreditTransaction, {
        accountId: account.id,
        amount,
        balanceAfter: account.balance,
        type: 'TOPUP',
        description: `Purchased ${amount} credit top-up pack`,
      });
      await queryRunner.manager.save(tx);

      const formatted = `$${(costCents / 100).toFixed(2)}`;
      const invoice = queryRunner.manager.create(Invoice, {
        organizationId,
        amountCents: costCents,
        amountFormatted: formatted,
        description: `Credit Top-Up — ${amount} credits`,
        status: 'Paid',
      });
      await queryRunner.manager.save(invoice);

      await queryRunner.commitTransaction();
      return { account, invoice };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getTransactions(
    organizationId: string,
    limit = 50,
  ): Promise<CreditTransaction[]> {
    const account = await this.getAccount(organizationId);
    return this.txRepo.find({
      where: { accountId: account.id },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
