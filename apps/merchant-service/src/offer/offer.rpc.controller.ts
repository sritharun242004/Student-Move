import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MERCHANT_SERVICE_PATTERNS } from '@app/contracts';
import type {
  OfferByIdPayload,
  StudentScopedPayload,
  UserScopedPayload,
} from '@app/contracts';
import type {
  CreateOfferDto,
  ToggleOfferStatusDto,
  UpdateOfferDto,
} from './offer.dto';
import { OfferService } from './offer.service';

@Controller()
export class OfferRpcController {
  constructor(private readonly offerService: OfferService) {}

  @MessagePattern(MERCHANT_SERVICE_PATTERNS.offerCreate)
  createOffer(@Payload() payload: UserScopedPayload<CreateOfferDto>) {
    return this.offerService.createOffer(payload.userId, payload.body as CreateOfferDto);
  }

  @MessagePattern(MERCHANT_SERVICE_PATTERNS.offerUpdate)
  updateOffer(@Payload() payload: OfferByIdPayload<UpdateOfferDto>) {
    return this.offerService.updateOffer(payload.userId, payload.offerId, payload.body ?? {});
  }

  @MessagePattern(MERCHANT_SERVICE_PATTERNS.offerToggle)
  toggleOffer(@Payload() payload: OfferByIdPayload<ToggleOfferStatusDto>) {
    return this.offerService.toggleOffer(payload.userId, payload.offerId, payload.body as ToggleOfferStatusDto);
  }

  @MessagePattern(MERCHANT_SERVICE_PATTERNS.offerDelete)
  deleteOffer(@Payload() payload: OfferByIdPayload) {
    return this.offerService.deleteOffer(payload.userId, payload.offerId);
  }

  @MessagePattern(MERCHANT_SERVICE_PATTERNS.offerGetMerchantOffers)
  getMerchantOffers(@Payload() payload: UserScopedPayload) {
    return this.offerService.getMerchantOffers(payload.userId);
  }

  @MessagePattern(MERCHANT_SERVICE_PATTERNS.offerGetActiveOffers)
  getActiveOffers() {
    return this.offerService.getActiveOffers();
  }

  @MessagePattern(MERCHANT_SERVICE_PATTERNS.offerGetRedeemedOffersForStudent)
  getRedeemedOffersForStudent(@Payload() payload: StudentScopedPayload) {
    return this.offerService.getRedeemedOffersForStudent(payload.studentId);
  }
}
