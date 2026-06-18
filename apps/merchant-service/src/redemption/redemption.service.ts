import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { NotificationService } from '@app/notifications';
import { Offer } from '../domain/entities/offer.entity';
import {
  RedemptionRecord,
  RedemptionStatus,
} from '../domain/entities/redemption-record.entity';
import { Voucher, VoucherStatus } from '../domain/entities/voucher.entity';
import { MerchantService } from '../merchant/merchant.service';
import { MerchantActivityItemDto, ValidateVoucherDto } from './redemption.dto';

@Injectable()
export class RedemptionService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Voucher)
    private readonly voucherRepository: Repository<Voucher>,
    @InjectRepository(RedemptionRecord)
    private readonly redemptionRepository: Repository<RedemptionRecord>,
    private readonly merchantService: MerchantService,
    private readonly notificationService: NotificationService,
  ) {}

  async validateAndRedeem(userId: string, dto: ValidateVoucherDto): Promise<{
    success: boolean;
    voucherId?: string;
    status: VoucherStatus;
  }> {
    const uniqueCode = dto.uniqueCode;
    // check if uniqueCode is provided
    if (!uniqueCode) {
      throw new BadRequestException('uniqueCode is required');
    }

    // check if merchant is approved and not suspended
    const merchant = await this.merchantService.getMerchantByUserIdWithSecretCode(userId);
    if (!merchant.isApproved) {
      throw new ForbiddenException('Merchant is not approved');
    }
    if (merchant.isSuspended) {
      throw new ForbiddenException('Merchant is suspended');
    }

    // find voucher by unique code and load its offer and merchant
    const voucher = await this.voucherRepository.findOne({
      where: { uniqueCode },
      relations: {
        offer: true,
      },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }

    if (voucher.offer.merchantId !== merchant.id) {
      await this.logAttempt(voucher.id, merchant.id, RedemptionStatus.FAILED, 'Wrong merchant');
      throw new ForbiddenException('Voucher does not belong to this merchant');
    }

    if (merchant.secretCodeHash) {
      if (!dto.merchantSecretCode) {
        await this.logAttempt(
          voucher.id,
          merchant.id,
          RedemptionStatus.FAILED,
          'Missing merchant secret code',
        );
        throw new ForbiddenException('Merchant secret code is required');
      }

      if (!this.merchantService.isValidSecretCodeFormat(dto.merchantSecretCode)) {
        await this.logAttempt(
          voucher.id,
          merchant.id,
          RedemptionStatus.FAILED,
          'Invalid merchant secret code format',
        );
        throw new BadRequestException('merchantSecretCode must be a 4 to 6 digit code');
      }

      if (!this.merchantService.verifyMerchantSecretCode(merchant, dto.merchantSecretCode)) {
        await this.logAttempt(
          voucher.id,
          merchant.id,
          RedemptionStatus.FAILED,
          'Invalid merchant secret code',
        );
        throw new ForbiddenException('Invalid merchant secret code');
      }
    }

    const redeemedVoucher = await this.dataSource.transaction(async (manager) => {
      const lockedVoucher = await manager
        .getRepository(Voucher)
        .createQueryBuilder('voucher')
        .innerJoinAndSelect('voucher.offer', 'offer')
        .setLock('pessimistic_write')
        .where('voucher.id = :voucherId', { voucherId: voucher.id })
        .getOne();

      if (!lockedVoucher) {
        throw new NotFoundException('Voucher not found');
      }

      if (lockedVoucher.status === VoucherStatus.REDEEMED) {
        await this.logAttemptWithManager(
          manager,
          lockedVoucher.id,
          merchant.id,
          RedemptionStatus.FAILED,
          'Already redeemed',
        );
        throw new BadRequestException('Voucher already redeemed');
      }

      if (lockedVoucher.validUntil.getTime() <= Date.now()) {
        await this.logAttemptWithManager(
          manager,
          lockedVoucher.id,
          merchant.id,
          RedemptionStatus.FAILED,
          'Voucher expired',
        );
        throw new BadRequestException('Voucher expired');
      }

      lockedVoucher.status = VoucherStatus.REDEEMED;
      await manager.getRepository(Voucher).save(lockedVoucher);
      await manager.increment(Offer, { id: lockedVoucher.offerId }, 'usedCount', 1);
      await this.logAttemptWithManager(
        manager,
        lockedVoucher.id,
        merchant.id,
        RedemptionStatus.SUCCESS,
      );

      return lockedVoucher;
    });

    void this.notificationService.sendNotification({
      recipient_id: redeemedVoucher.studentId,
      notification_type: 'offers',
      title: 'Voucher Redeemed',
      message: `Your ${redeemedVoucher.offer?.title ?? 'offer'} voucher has been successfully redeemed.`,
      metadata: { voucherId: redeemedVoucher.id },
    });

    return {
      success: true,
      voucherId: redeemedVoucher.id,
      status: redeemedVoucher.status,
    };
  }

  async getMerchantActivity(userId: string): Promise<MerchantActivityItemDto[]> {
    const merchant = await this.merchantService.getMerchantByUserId(userId);
    const records = await this.redemptionRepository.find({
      where: { merchantId: merchant.id },
      relations: {
        voucher: {
          offer: true,
        },
      },
      order: {
        scannedAt: 'DESC',
      },
      take: 100,
    });

    return records.map((record) => ({
      voucherId: record.voucherId,
      offerName: record.voucher.offer.title,
      studentId: record.voucher.studentId,
      voucherStatus: record.voucher.status,
      redeemStatus: record.status,
      reason: record.reason ?? null,
      scannedAt: record.scannedAt,
    }));
  }

  private async logAttempt(
    voucherId: string,
    merchantId: string,
    status: RedemptionStatus,
    reason?: string,
  ): Promise<void> {
    const record = this.redemptionRepository.create({
      voucherId,
      merchantId,
      status,
      reason,
    });
    await this.redemptionRepository.save(record);
  }

  private async logAttemptWithManager(
    manager: EntityManager,
    voucherId: string,
    merchantId: string,
    status: RedemptionStatus,
    reason?: string,
  ): Promise<void> {
    const record = manager.create(RedemptionRecord, {
      voucherId,
      merchantId,
      status,
      reason,
    });
    await manager.save(RedemptionRecord, record);
  }
}
