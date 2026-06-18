import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailerService } from '@app/mailer';
import { MerchantProfile } from '../domain/entities/merchant-profile.entity';
import { Offer } from '../domain/entities/offer.entity';
import { RedemptionRecord, RedemptionStatus } from '../domain/entities/redemption-record.entity';
import { Voucher, VoucherStatus } from '../domain/entities/voucher.entity';
import {
  MerchantApprovalDto,
  MerchantSuspensionDto,
  RegisterMerchantDto,
  SetMerchantSecretCodeDto,
  UpdateMerchantProfileDto,
} from './merchant.dto';

interface MainAuthRegisterResponse {
  userData: {
    id: string;
  };
}

@Injectable()
export class MerchantService {
  constructor(
    @InjectRepository(MerchantProfile)
    private readonly merchantRepository: Repository<MerchantProfile>,
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(Voucher)
    private readonly voucherRepository: Repository<Voucher>,
    @InjectRepository(RedemptionRecord)
    private readonly redemptionRepository: Repository<RedemptionRecord>,
    private readonly mailerService: MailerService,
  ) {}

  async register(dto: RegisterMerchantDto): Promise<MerchantProfile> {
    this.validateRegisterInput(dto);

    const existingMerchant = await this.merchantRepository.findOne({
      where: [{ businessEmail: dto.email }, { phone: dto.phone }],
    });

    if (existingMerchant) {
      throw new ConflictException('Merchant with given email or phone already exists');
    }

    const createdUserId = await this.createMainSystemUser(dto);

    const merchant = this.merchantRepository.create({
      userId: createdUserId,
      businessName: dto.businessName,
      description: dto.description,
      businessEmail: dto.email,
      phone: dto.phone,
      address: dto.address,
      isApproved: false,
      isSuspended: false,
    });

    return this.merchantRepository.save(merchant);
  }

  async getMyProfile(userId: string): Promise<MerchantProfile> {
    const merchant = await this.merchantRepository.findOne({ where: { userId } });
    if (!merchant) {
      throw new NotFoundException('Merchant profile not found');
    }

    return merchant;
  }

  async getById(merchantId: string): Promise<MerchantProfile> {
    const merchant = await this.merchantRepository.findOne({ where: { id: merchantId } });
    if (!merchant) {
      throw new NotFoundException('Merchant profile not found');
    }

    return merchant;
  }

  async getAdminMerchantList(): Promise<Array<MerchantProfile & {
    offerCounts: { active: number; all: number };
  }>> {
    const merchants = await this.merchantRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    if (!merchants.length) {
      return [];
    }

    const merchantIds = merchants.map((merchant) => merchant.id);

    const offerCountRows = await this.offerRepository
      .createQueryBuilder('offer')
      .select('offer.merchantId', 'merchantId')
      .addSelect('COUNT(*)::int', 'allCount')
      .addSelect(
        "SUM(CASE WHEN offer.isActive = true AND offer.expiryDate > NOW() THEN 1 ELSE 0 END)::int",
        'activeCount',
      )
      .where('offer.merchantId IN (:...merchantIds)', { merchantIds })
      .groupBy('offer.merchantId')
      .getRawMany<{ merchantId: string; allCount: number; activeCount: number }>();

    const offerCountByMerchantId = new Map(
      offerCountRows.map((row) => [
        row.merchantId,
        {
          active: Number(row.activeCount ?? 0),
          all: Number(row.allCount ?? 0),
        },
      ]),
    );

    return merchants.map((merchant) => ({
      ...merchant,
      offerCounts: offerCountByMerchantId.get(merchant.id) ?? { active: 0, all: 0 },
    }));
  }

  async getAdminOffersByMerchantId(merchantId: string): Promise<{
    merchant: MerchantProfile;
    summary: {
      totalOffers: number;
      activeOffers: number;
      inactiveOffers: number;
      expiredOffers: number;
    };
    offers: Offer[];
  }> {
    const merchant = await this.getById(merchantId);

    const offers = await this.offerRepository.find({
      where: { merchantId },
      order: { createdAt: 'DESC' },
    });

    const totalOffers = offers.length;
    const now = Date.now();
    const activeOffers = offers.filter((offer) => offer.isActive && offer.expiryDate.getTime() > now).length;
    const inactiveOffers = offers.filter((offer) => !offer.isActive).length;
    const expiredOffers = offers.filter((offer) => offer.expiryDate.getTime() <= now).length;

    return {
      merchant,
      summary: {
        totalOffers,
        activeOffers,
        inactiveOffers,
        expiredOffers,
      },
      offers,
    };
  }

  async getAdminOverviewStats(): Promise<{
    totalOffers: number;
    activeOffers: number;
    inactiveOffers: number;
    expiredOffers: number;
    totalMerchants: number;
    approvedMerchants: number;
    suspendedMerchants: number;
    successfulRedeems: number;
    failedRedeems: number;
    totalVouchers: number;
    redeemedVouchers: number;
    expiredVouchers: number;
    pendingVouchers: number;
    totalStudentsWithRedeems: number;
    lastUpdatedAt: string;
  }> {
    const [
      totalOffers,
      activeOffers,
      inactiveOffers,
      expiredOffers,
      totalMerchants,
      approvedMerchants,
      suspendedMerchants,
      successfulRedeems,
      failedRedeems,
      totalVouchers,
      redeemedVouchers,
      expiredVouchers,
      pendingVouchers,
    ] = await Promise.all([
      this.offerRepository.count(),
      this.offerRepository
        .createQueryBuilder('offer')
        .where('offer.isActive = true')
        .andWhere('offer.expiryDate > NOW()')
        .getCount(),
      this.offerRepository.count({ where: { isActive: false } }),
      this.offerRepository
        .createQueryBuilder('offer')
        .where('offer.expiryDate <= NOW()')
        .getCount(),
      this.merchantRepository.count(),
      this.merchantRepository.count({ where: { isApproved: true } }),
      this.merchantRepository.count({ where: { isSuspended: true } }),
      this.redemptionRepository.count({ where: { status: RedemptionStatus.SUCCESS } }),
      this.redemptionRepository.count({ where: { status: RedemptionStatus.FAILED } }),
      this.voucherRepository.count(),
      this.voucherRepository.count({ where: { status: VoucherStatus.REDEEMED } }),
      this.voucherRepository
        .createQueryBuilder('voucher')
        .where('voucher.status = :status', { status: VoucherStatus.PENDING })
        .andWhere('voucher.validUntil <= NOW()')
        .getCount(),
      this.voucherRepository
        .createQueryBuilder('voucher')
        .where('voucher.status = :status', { status: VoucherStatus.PENDING })
        .andWhere('voucher.validUntil > NOW()')
        .getCount(),
    ]);

    const distinctStudentsRow = await this.voucherRepository
      .createQueryBuilder('voucher')
      .select('COUNT(DISTINCT voucher.studentId)', 'count')
      .where('voucher.status = :status', { status: VoucherStatus.REDEEMED })
      .getRawOne<{ count: string }>();

    return {
      totalOffers,
      activeOffers,
      inactiveOffers,
      expiredOffers,
      totalMerchants,
      approvedMerchants,
      suspendedMerchants,
      successfulRedeems,
      failedRedeems,
      totalVouchers,
      redeemedVouchers,
      expiredVouchers,
      pendingVouchers,
      totalStudentsWithRedeems: Number(distinctStudentsRow?.count ?? 0),
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  async getMyOverviewStats(userId: string): Promise<{
    totalOffers: number;
    activeOffers: number;
    inactiveOffers: number;
    expiredOffers: number;
    successfulRedeems: number;
    failedRedeems: number;
    totalVouchers: number;
    expiredVouchers: number;
    pendingVouchers: number;
    totalStudentsWithRedeems: number;
    lastUpdatedAt: string;
  }> {
    const merchant = await this.getMerchantByUserId(userId);
    const merchantId = merchant.id;

    const [
      totalOffers,
      activeOffers,
      inactiveOffers,
      expiredOffers,
      successfulRedeems,
      failedRedeems,
      totalVouchers,
      expiredVouchers,
      pendingVouchers,
    ] = await Promise.all([
      this.offerRepository.count({ where: { merchantId } }),
      this.offerRepository
        .createQueryBuilder('offer')
        .where('offer.merchantId = :merchantId', { merchantId })
        .andWhere('offer.isActive = true')
        .andWhere('offer.expiryDate > NOW()')
        .getCount(),
      this.offerRepository.count({ where: { merchantId, isActive: false } }),
      this.offerRepository
        .createQueryBuilder('offer')
        .where('offer.merchantId = :merchantId', { merchantId })
        .andWhere('offer.expiryDate <= NOW()')
        .getCount(),
      this.redemptionRepository.count({ where: { merchantId, status: RedemptionStatus.SUCCESS } }),
      this.redemptionRepository.count({ where: { merchantId, status: RedemptionStatus.FAILED } }),
      this.voucherRepository
        .createQueryBuilder('voucher')
        .innerJoin('voucher.offer', 'offer')
        .where('offer.merchantId = :merchantId', { merchantId })
        .getCount(),
      this.voucherRepository
        .createQueryBuilder('voucher')
        .innerJoin('voucher.offer', 'offer')
        .where('offer.merchantId = :merchantId', { merchantId })
        .andWhere('voucher.status = :status', { status: VoucherStatus.PENDING })
        .andWhere('voucher.validUntil <= NOW()')
        .getCount(),
      this.voucherRepository
        .createQueryBuilder('voucher')
        .innerJoin('voucher.offer', 'offer')
        .where('offer.merchantId = :merchantId', { merchantId })
        .andWhere('voucher.status = :status', { status: VoucherStatus.PENDING })
        .andWhere('voucher.validUntil > NOW()')
        .getCount(),
    ]);

    const distinctStudentsRow = await this.voucherRepository
      .createQueryBuilder('voucher')
      .select('COUNT(DISTINCT voucher.studentId)', 'count')
      .innerJoin('voucher.offer', 'offer')
      .where('offer.merchantId = :merchantId', { merchantId })
      .andWhere('voucher.status = :status', { status: VoucherStatus.REDEEMED })
      .getRawOne<{ count: string }>();

    return {
      totalOffers,
      activeOffers,
      inactiveOffers,
      expiredOffers,
      successfulRedeems,
      failedRedeems,
      totalVouchers,
      expiredVouchers,
      pendingVouchers,
      totalStudentsWithRedeems: Number(distinctStudentsRow?.count ?? 0),
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  async getMyStatus(userId: string): Promise<{ isApproved: boolean; isSuspended: boolean; hasSecretCode: boolean }> {
    const merchant = await this.getMerchantByUserIdWithSecretCode(userId);

    return {
      isApproved: merchant.isApproved,
      isSuspended: merchant.isSuspended,
      hasSecretCode: Boolean(merchant.secretCodeHash),
    };
  }

  async updateMyProfile(
    userId: string,
    dto: UpdateMerchantProfileDto,
  ): Promise<MerchantProfile> {
    this.validateUpdateProfileInput(dto);

    const merchant = await this.getMyProfile(userId);

    if (dto.businessName !== undefined && dto.businessName !== '') {
      merchant.businessName = dto.businessName;
    }
    if (dto.description !== undefined && dto.description !== '') {
      merchant.description = dto.description;
    }
    if (dto.address !== undefined && dto.address !== '') {
      merchant.address = dto.address;
    }
    if (dto.businessEmail !== undefined && dto.businessEmail !== '') {
      merchant.businessEmail = dto.businessEmail;
    }
    if (dto.phone !== undefined && dto.phone !== '') {
      merchant.phone = dto.phone;
    }
    if (dto.profileImageUrl !== undefined) {
      merchant.profileImageUrl = dto.profileImageUrl;
    }

    return this.merchantRepository.save(merchant);
  }

  async updateApproval(
    merchantId: string,
    dto: MerchantApprovalDto,
  ): Promise<MerchantProfile> {
    const merchant = await this.getById(merchantId);
    merchant.isApproved = dto.isApproved;
    const saved = await this.merchantRepository.save(merchant);
//
    if (dto.isApproved) {
      const attachmentPath = process.env.MERCHANT_APPROVAL_ATTACHMENT; 
      void this.mailerService.sendMail(
        merchant.businessEmail,
        'Your merchant profile has been approved',
        `Hi ${merchant.businessName},\n\n Your merchant profile on Student Moves has been approved. You can now start creating offers. Please follow the attached guideline to get started.\n\nThank you,\nThe Student Moves Team`,
        attachmentPath
          ? [{ filename: attachmentPath.split('/').pop() ?? 'attachment', path: attachmentPath }]
          : undefined,
      );
    }

    return saved;
  }

  async updateSuspension(
    merchantId: string,
    dto: MerchantSuspensionDto,
  ): Promise<MerchantProfile> {
    const merchant = await this.getById(merchantId);
    merchant.isSuspended = dto.isSuspended;
    const saved = await this.merchantRepository.save(merchant);

    if (dto.isSuspended) {
      void this.mailerService.sendMail(
        merchant.businessEmail,
        'Your merchant account has been suspended',
        `Hi ${merchant.businessName},\n\nYour merchant account on Student Moves has been suspended. If you believe this is a mistake, please contact our support team.\n\nThank you,\nThe Student Moves Team`,
      );
    } else {
      void this.mailerService.sendMail(
        merchant.businessEmail,
        'Your merchant account has been reinstated',
        `Hi ${merchant.businessName},\n\nYour merchant account on Student Moves has been reinstated. You can now continue creating and managing your offers.\n\nThank you,\nThe Student Moves Team`,
      );
    }
    
    

    return saved;
  }

  async getMerchantByUserId(userId: string): Promise<MerchantProfile> {
    const merchant = await this.merchantRepository.findOne({ where: { userId } });
    if (!merchant) {
      throw new ForbiddenException('No merchant profile found for token user');
    }

    return merchant;
  }

  async getMerchantByUserIdWithSecretCode(userId: string): Promise<MerchantProfile> {
    const merchant = await this.merchantRepository
      .createQueryBuilder('merchant')
      .addSelect('merchant.secretCodeHash')
      .where('merchant.userId = :userId', { userId })
      .getOne();

    if (!merchant) {
      throw new ForbiddenException('No merchant profile found for token user');
    }

    return merchant;
  }

  async setOrUpdateSecretCode(
    userId: string,
    dto: SetMerchantSecretCodeDto,
  ): Promise<{ success: boolean; message: string }> {
    this.validateSecretCodeOrThrow(dto.secretCode, 'secretCode');

    const merchant = await this.getMerchantByUserIdWithSecretCode(userId);
    const hasExistingSecretCode = Boolean(merchant.secretCodeHash);

    if (hasExistingSecretCode) {
      if (!dto.previousSecretCode) {
        throw new BadRequestException('previousSecretCode is required when updating secret code');
      }

      this.validateSecretCodeOrThrow(dto.previousSecretCode, 'previousSecretCode');

      if (!this.verifyMerchantSecretCode(merchant, dto.previousSecretCode)) {
        throw new ForbiddenException('Previous secret code is incorrect');
      }
    } else if (dto.previousSecretCode) {
      throw new BadRequestException('previousSecretCode is not allowed when no secret code is set');
    }

    merchant.secretCodeHash = this.hashSecretCode(dto.secretCode);
    await this.merchantRepository.save(merchant);

    return {
      success: true,
      message: hasExistingSecretCode
        ? 'Merchant secret code updated successfully'
        : 'Merchant secret code set successfully',
    };
  }

  verifyMerchantSecretCode(merchant: MerchantProfile, secretCode: string): boolean {
    if (!merchant.secretCodeHash) {
      return true;
    }

    const [salt, expectedHash] = merchant.secretCodeHash.split('.');
    if (!salt || !expectedHash) {
      return false;
    }

    const computedHash = scryptSync(secretCode, salt, 32).toString('hex');
    const expectedHashBuffer = Buffer.from(expectedHash, 'hex');
    const computedHashBuffer = Buffer.from(computedHash, 'hex');

    if (expectedHashBuffer.length !== computedHashBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedHashBuffer, computedHashBuffer);
  }

  isValidSecretCodeFormat(secretCode: string): boolean {
    return /^\d{4,6}$/.test(secretCode);
  }

  private validateRegisterInput(dto: RegisterMerchantDto): void {
    if (!dto.email || !dto.password || !dto.phone || !dto.businessName || !dto.address) {
      throw new BadRequestException('Missing required registration fields');
    }
    // email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email)) {
      throw new BadRequestException('Invalid email format');
    }

    if (dto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }
  }

  private validateUpdateProfileInput(dto: UpdateMerchantProfileDto): void {
    if (dto.businessEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.businessEmail)) {
      throw new BadRequestException('Invalid business email format');
    }
  }

  private validateSecretCodeOrThrow(secretCode: string, fieldName: string): void {
    if (!this.isValidSecretCodeFormat(secretCode)) {
      throw new BadRequestException(`${fieldName} must be a 4 to 6 digit code`);
    }
  }

  private hashSecretCode(secretCode: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(secretCode, salt, 32).toString('hex');
    return `${salt}.${hash}`;
  }

  private async createMainSystemUser(dto: RegisterMerchantDto): Promise<string> {
    try {
      const host = process.env.MAIN_SERVICE_BASE_URL;
      if (!host) {
        throw new BadGatewayException('MAIN_SERVICE_BASE_URL is not configured');
      }

      const registerUrl = `${host}/api/auth/register/`;

      const response = await fetch(registerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          password: dto.password,
          role: 'merchant',
          phone: dto.phone,
        }),
      });

      if (!response.ok) {

        if (response.status === 400) {
          console.error('Main auth service responded with 400 Bad Request for merchant registration:', await response.text());
          throw new ConflictException('This Account already exists!');
        }

        if (response.status >= 500) {
          throw new BadGatewayException('Main auth service is currently unreachable');
        }

        throw new BadGatewayException(
          `Main auth registration failed: ${response.status} ${response.statusText}`,
        );
      }

      const body = (await response.json()) as MainAuthRegisterResponse;
      const userId = body.userData.id;
      if (!userId) {
        throw new BadGatewayException('Main auth response does not include user id');
      }

      return userId;
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadGatewayException) {
        throw error;
      }

      if (error instanceof Error) {
        throw new BadGatewayException(`Failed to connect to main auth service: ${error.message}`);
      }

      throw new BadGatewayException('Failed to connect to main auth service');
    }
  }
}
