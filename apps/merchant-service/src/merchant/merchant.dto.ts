export interface RegisterMerchantDto {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  phone: string;
  businessName: string;
  description?: string;
  address: string;
}

export interface UpdateMerchantProfileDto {
  businessName?: string;
  description?: string;
  address?: string;
  businessEmail?: string;
  phone?: string;
  profileImageUrl?: string;
}

export interface MerchantApprovalDto {
  isApproved: boolean;
}

export interface MerchantSuspensionDto {
  isSuspended: boolean;
}

export interface SetMerchantSecretCodeDto {
  secretCode: string;
  previousSecretCode?: string;
}
