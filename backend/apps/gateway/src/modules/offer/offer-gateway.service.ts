import { Injectable } from '@nestjs/common';
import { MerchantServiceClient } from '../../microservices/merchant-service.client';

@Injectable()
export class OfferGatewayService {
  constructor(private readonly merchantClient: MerchantServiceClient) {}

  createOffer(userId: string, body: Record<string, unknown>) {
    return this.merchantClient.createOffer({ userId, body });
  }

  updateOffer(userId: string, offerId: string, body: Record<string, unknown>) {
    return this.merchantClient.updateOffer({ userId, offerId, body });
  }

  toggleOffer(userId: string, offerId: string, body: Record<string, unknown>) {
    return this.merchantClient.toggleOffer({ userId, offerId, body });
  }

  deleteOffer(userId: string, offerId: string) {
    return this.merchantClient.deleteOffer({ userId, offerId });
  }

  getMerchantOffers(userId: string) {
    return this.merchantClient.getMerchantOffers({ userId });
  }

  getActiveOffers() {
    return this.merchantClient.getActiveOffers();
  }

  getRedeemedOffersForStudent(studentId: string) {
    return this.merchantClient.getRedeemedOffersForStudent({ studentId });
  }
}
