import { Injectable } from '@nestjs/common';
import { MerchantServiceClient } from '../../microservices/merchant-service.client';

@Injectable()
export class MerchantGatewayService {
  constructor(private readonly merchantClient: MerchantServiceClient) {}

  register(body: Record<string, unknown>) {
    return this.merchantClient.registerMerchant(body);
  }

  getMyProfile(userId: string) {
    return this.merchantClient.getMyMerchantProfile({ userId });
  }

  updateMyProfile(userId: string, body: Record<string, unknown>) {
    return this.merchantClient.updateMyMerchantProfile({ userId, body });
  }

  setOrUpdateSecretCode(userId: string, body: Record<string, unknown>) {
    return this.merchantClient.setMyMerchantSecretCode({ userId, body });
  }

  getById(merchantId: string) {
    return this.merchantClient.getMerchantById({ merchantId });
  }

  getAdminMerchantList() {
    return this.merchantClient.getAdminMerchantList();
  }

  getAdminOffersByMerchantId(merchantId: string) {
    return this.merchantClient.getAdminOffersByMerchantId({ merchantId });
  }

  getAdminOverviewStats() {
    return this.merchantClient.getAdminOverviewStats();
  }

  getMyOverviewStats(userId: string) {
    return this.merchantClient.getMyOverviewStats({ userId });
  }

  getMyStatus(userId: string) {
    return this.merchantClient.getMyMerchantStatus({ userId });
  }

  updateApproval(merchantId: string, body: Record<string, unknown>) {
    return this.merchantClient.updateMerchantApproval({ merchantId, body });
  }

  updateSuspension(merchantId: string, body: Record<string, unknown>) {
    return this.merchantClient.updateMerchantSuspension({ merchantId, body });
  }
}
