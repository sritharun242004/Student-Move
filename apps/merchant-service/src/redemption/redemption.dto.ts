import { RedemptionStatus } from '../domain/entities/redemption-record.entity';
import { VoucherStatus } from '../domain/entities/voucher.entity';

export interface ValidateVoucherDto {
  uniqueCode: string;
  merchantSecretCode?: string;
}

export interface MerchantActivityItemDto {
  voucherId: string;
  offerName: string;
  studentId: string;
  voucherStatus: VoucherStatus;
  redeemStatus: RedemptionStatus;
  reason: string | null;
  scannedAt: Date;
}
