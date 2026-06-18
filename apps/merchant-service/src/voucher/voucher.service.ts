import { randomInt } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from '@app/notifications';
import { MerchantProfile } from '../domain/entities/merchant-profile.entity';
import { Offer } from '../domain/entities/offer.entity';
import { Voucher, VoucherStatus } from '../domain/entities/voucher.entity';
import { CreateVoucherDto } from './voucher.dto';

@Injectable()
export class VoucherService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(Voucher)
    private readonly voucherRepository: Repository<Voucher>,
    private readonly notificationService: NotificationService,
  ) {}

  async createVoucher(studentId: string, dto: CreateVoucherDto): Promise<Voucher> {
    if (!dto.offerId) {
      throw new BadRequestException('offerId is required');
    }

    const offer = await this.offerRepository.findOne({
      where: { id: dto.offerId },
      relations: {
        merchant: true,
      },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    this.ensureOfferAvailable(offer, offer.merchant);


    if (offer.usageLimit !== undefined) {
      const totalCount = await this.voucherRepository.count({
        where: { offerId: offer.id },
      });
      if (totalCount >= offer.usageLimit) {
        throw new BadRequestException('Offer usage limit reached');
      }
    }

    const studentCount = await this.voucherRepository.count({
      where: {
        offerId: offer.id,
        studentId,
        status: VoucherStatus.REDEEMED,
      },
    });

    if (studentCount >= offer.perStudentLimit) {
      throw new BadRequestException('Student usage limit reached for this offer');
    }

    const uniqueCode = await this.generateUniqueCode(offer.merchant?.businessName);
    const voucher = this.voucherRepository.create({
      offerId: offer.id,
      studentId,
      uniqueCode,
      validUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
      status: VoucherStatus.PENDING,
    });

    const saved = await this.voucherRepository.save(voucher);

    void this.notificationService.sendNotification({
      recipient_id: studentId,
      notification_type: 'offers',
      title: 'Voucher Ready!',
      message: `Your voucher for ${offer.title} is ready. Use code ${saved.uniqueCode} — valid for 15 minutes.`,
      metadata: { voucherId: saved.id, offerId: offer.id },
    });

    return saved;
  }

  private ensureOfferAvailable(offer: Offer, merchant: MerchantProfile): void {
    if (!offer.isActive) {
      throw new BadRequestException('Offer is inactive');
    }
    if (offer.expiryDate.getTime() <= Date.now()) {
      throw new BadRequestException('Offer has expired');
    }
    if (!merchant.isApproved) {
      throw new ForbiddenException('Merchant is not approved');
    }
    if (merchant.isSuspended) {
      throw new ForbiddenException('Merchant is suspended');
    }
  }

  private async generateUniqueCode(businessName?: string): Promise<string> {
    const merchantCode = this.getMerchantCode(businessName);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = `${merchantCode}-${this.generateAlphaNumericSuffix(6)}`;
      const existing = await this.voucherRepository.findOne({
        where: { uniqueCode: candidate },
      });
      if (!existing) {
        return candidate;
      }
    }

    throw new BadRequestException('Failed to generate unique voucher code');
  }

  private getMerchantCode(businessName?: string): string {
    if (!businessName) {
      return 'VC';
    }

    const letters = businessName
      .trim()
      .replace(/[^a-zA-Z]/g, '')
      .toUpperCase();

    if (letters.length < 2) {
      return 'VC';
    }

    return letters.slice(0, 2);
  }

  private generateAlphaNumericSuffix(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let suffix = '';

    for (let index = 0; index < length; index += 1) {
      suffix += charset[randomInt(0, charset.length)];
    }

    return suffix;
  }
}
