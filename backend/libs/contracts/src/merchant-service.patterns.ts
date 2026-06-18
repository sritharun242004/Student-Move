export const MERCHANT_SERVICE_PATTERNS = {
  healthPing: 'merchant.health.ping',

  merchantRegister: 'merchant.register',
  merchantGetMyProfile: 'merchant.getMyProfile',
  merchantUpdateMyProfile: 'merchant.updateMyProfile',
  merchantGetById: 'merchant.getById',
  merchantAdminList: 'merchant.admin.list',
  merchantAdminGetOffersByMerchantId: 'merchant.admin.getOffersByMerchantId',
  merchantAdminGetOverviewStats: 'merchant.admin.getOverviewStats',
  merchantGetMyOverviewStats: 'merchant.getMyOverviewStats',
  merchantGetMyStatus: 'merchant.getMyStatus',
  merchantUpdateApproval: 'merchant.updateApproval',
  merchantUpdateSuspension: 'merchant.updateSuspension',
  merchantSetSecretCode: 'merchant.setSecretCode',

  offerCreate: 'offer.create',
  offerUpdate: 'offer.update',
  offerToggle: 'offer.toggle',
  offerDelete: 'offer.delete',
  offerGetMerchantOffers: 'offer.getMerchantOffers',
  offerGetActiveOffers: 'offer.getActiveOffers',
  offerGetRedeemedOffersForStudent: 'offer.getRedeemedOffersForStudent',

  voucherCreate: 'voucher.create',

  redemptionValidateAndRedeem: 'redemption.validateAndRedeem',
  redemptionGetMerchantActivity: 'redemption.getMerchantActivity',
} as const;

export interface UserScopedPayload<T = unknown> {
  userId: string;
  body?: T;
}

export interface MerchantByIdPayload {
  merchantId: string;
}

export interface MerchantOffersByMerchantIdPayload {
  merchantId: string;
}

export interface MerchantActionByIdPayload<T = unknown> {
  merchantId: string;
  body: T;
}

export interface OfferByIdPayload<T = unknown> {
  userId: string;
  offerId: string;
  body?: T;
}

export interface StudentScopedPayload {
  studentId: string;
}

export interface RedemptionValidatePayload {
  userId: string;
  uniqueCode: string;
  merchantSecretCode?: string;
}
