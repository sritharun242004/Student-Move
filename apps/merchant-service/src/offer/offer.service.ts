import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { MerchantProfile } from '../domain/entities/merchant-profile.entity';
import { Offer } from '../domain/entities/offer.entity';
import { Voucher, VoucherStatus } from '../domain/entities/voucher.entity';
import { CreateOfferDto, ToggleOfferStatusDto, UpdateOfferDto } from './offer.dto';
import { MerchantService } from '../merchant/merchant.service';

@Injectable()
export class OfferService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(Voucher)
    private readonly voucherRepository: Repository<Voucher>,
    private readonly merchantService: MerchantService,
  ) {}

  async createOffer(userId: string, dto: CreateOfferDto): Promise<Offer> {
    const merchant = await this.requireActiveMerchant(userId);

    this.validateOfferInput(dto.perStudentLimit, dto.expiryDate, dto.usageLimit);

    const offer = this.offerRepository.create({
      merchantId: merchant.id,
      title: dto.title,
      description: dto.description,
      imageUrl: dto.imageUrl,
      discountType: dto.discountType,
      amount: dto.amount,
      usageLimit: dto.usageLimit,
      perStudentLimit: dto.perStudentLimit,
      expiryDate: new Date(dto.expiryDate),
      isActive: dto.isActive ?? true,
    });

    return this.offerRepository.save(offer);
  }

  async updateOffer(userId: string, offerId: string, dto: UpdateOfferDto): Promise<Offer> {
    const merchant = await this.requireActiveMerchant(userId);
    const offer = await this.requireMerchantOffer(merchant.id, offerId);

    if (dto.perStudentLimit !== undefined && dto.perStudentLimit <= 0) {
      throw new BadRequestException('perStudentLimit should be greater than zero');
    }

    if (dto.usageLimit !== undefined && dto.usageLimit <= 0) {
      throw new BadRequestException('usageLimit should be greater than zero');
    }

    if (dto.usedCount !== undefined && dto.usedCount < 0) {
      throw new BadRequestException('usedCount cannot be negative');
    }

    if (dto.expiryDate !== undefined) {
      const expiryDate = new Date(dto.expiryDate);
      if (Number.isNaN(expiryDate.getTime())) {
        throw new BadRequestException('expiryDate must be a valid ISO date string');
      }
      offer.expiryDate = expiryDate;
    }

    if (dto.title !== undefined) {
      offer.title = dto.title;
    }
    if (dto.description !== undefined) {
      offer.description = dto.description;
    }
    if (dto.imageUrl !== undefined) {
      offer.imageUrl = dto.imageUrl;
    }
    if (dto.discountType !== undefined) {
      offer.discountType = dto.discountType;
    }
    if (dto.usageLimit !== undefined) {
      offer.usageLimit = dto.usageLimit;
    }
    if (dto.perStudentLimit !== undefined) {
      offer.perStudentLimit = dto.perStudentLimit;
    }
    if (dto.amount !== undefined) {
      offer.amount = dto.amount;
    }
    if (dto.usedCount !== undefined) {
      offer.usedCount = dto.usedCount;
    }

    if (dto.isActive !== undefined) {
      offer.isActive = dto.isActive;
    }

    return this.offerRepository.save(offer);
  }

  async toggleOffer(userId: string, offerId: string, dto: ToggleOfferStatusDto): Promise<Offer> {
    const merchant = await this.requireActiveMerchant(userId);
    const offer = await this.requireMerchantOffer(merchant.id, offerId);
    offer.isActive = dto.isActive;
    return this.offerRepository.save(offer);
  }

  async deleteOffer(userId: string, offerId: string): Promise<{ success: boolean; offerId: string }> {
    const merchant = await this.requireActiveMerchant(userId);
    const offer = await this.requireMerchantOffer(merchant.id, offerId);

    await this.offerRepository.remove(offer);

    return {
      success: true,
      offerId,
    };
  }

  async getMerchantOffers(userId: string): Promise<Offer[]> {
    const merchant = await this.requireMerchantByUserId(userId);
    return this.offerRepository.find({
      where: { merchantId: merchant.id },
      order: { createdAt: 'DESC' },
    });
  }

  async getActiveOffers(): Promise<Offer[]> {
    return this.offerRepository.find({
      where: {
        isActive: true,
        expiryDate: MoreThan(new Date()),
        merchant: {
          isApproved: true,
          isSuspended: false,
        },
      },
      relations: {
        merchant: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getRedeemedOffersForStudent(studentId: string): Promise<Voucher[]> {
    return this.voucherRepository.find({
      where: {
        studentId,
        status: VoucherStatus.REDEEMED,
      },
      relations: {
        offer: true,
      },
      order: { updatedAt: 'DESC' },
    });
  }

  private async requireActiveMerchant(userId: string): Promise<MerchantProfile> {
    const merchant = await this.merchantService.getMerchantByUserId(userId);
    if (!merchant.isApproved) {
      throw new ForbiddenException('Merchant is not approved yet');
    }
    if (merchant.isSuspended) {
      throw new ForbiddenException('Merchant is suspended');
    }

    return merchant;
  }

  private async requireMerchantByUserId(userId: string): Promise<MerchantProfile> {
    const merchant = await this.merchantService.getMerchantByUserId(userId);
    if (!merchant) {
      throw new NotFoundException('Merchant profile not found for user');
    }
    return merchant;
  }

  private async requireMerchantOffer(merchantId: string, offerId: string): Promise<Offer> {
    const offer = await this.offerRepository.findOne({
      where: { id: offerId, merchantId },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found for merchant');
    }

    return offer;
  }

  private validateOfferInput(
    perStudentLimit: number,
    expiryDateRaw: string,
    usageLimit?: number,
  ): void {
    if (perStudentLimit <= 0) {
      throw new BadRequestException('perStudentLimit should be greater than zero');
    }

    if (usageLimit !== undefined && usageLimit <= 0) {
      throw new BadRequestException('usageLimit should be greater than zero');
    }

    const expiryDate = new Date(expiryDateRaw);
    if (Number.isNaN(expiryDate.getTime())) {
      throw new BadRequestException('expiryDate must be a valid ISO date string');
    }
  }
}
