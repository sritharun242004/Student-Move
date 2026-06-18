import { DiscountType } from '../domain/entities/offer.entity';

export interface CreateOfferDto {
  title: string;
  description: string;
  imageUrl?: string;
  discountType: DiscountType;
  amount?: number;
  usageLimit?: number;
  perStudentLimit: number;
  expiryDate: string;
  isActive?: boolean;
}

export interface UpdateOfferDto {
  title?: string;
  description?: string;
  imageUrl?: string;
  discountType?: DiscountType;
  amount?: number;
  usageLimit?: number;
  perStudentLimit?: number;
  expiryDate?: string;
  usedCount?: number;
  isActive?: boolean;
}

export interface ToggleOfferStatusDto {
  isActive: boolean;
}
