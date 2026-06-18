import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MERCHANT_SERVICE_PATTERNS } from '@app/contracts';
import type {
  MerchantActionByIdPayload,
  MerchantByIdPayload,
  MerchantOffersByMerchantIdPayload,
  UserScopedPayload,
} from '@app/contracts';
import type {
  MerchantApprovalDto,
  MerchantSuspensionDto,
  RegisterMerchantDto,
  SetMerchantSecretCodeDto,
  UpdateMerchantProfileDto,
} from './merchant.dto';
import { MerchantService } from './merchant.service';

@Controller()
export class MerchantRpcController {
  constructor(private readonly merchantService: MerchantService) {}

  @MessagePattern(MERCHANT_SERVICE_PATTERNS.merchantRegister)
  register(@Payload() payload: RegisterMerchantDto) {
    return this.merchantService.register(payload);
  }

  @MessagePattern(MERCHANT_SERVICE_PATTERNS.merchantGetMyProfile)
  getMyProfile(@Payload() payload: UserScopedPayload) {
    return this.merchantService.getMyProfile(payload.userId);
  }

  @MessagePattern(MERCHANT_SERVICE_PATTERNS.merchantUpdateMyProfile)
  updateMyProfile(@Payload() payload: UserScopedPayload<UpdateMerchantProfileDto>) {
    return this.merchantService.updateMyProfile(payload.userId, payload.body ?? {});
  }

  @MessagePattern(MERCHANT_SERVICE_PATTERNS.merchantGetById)
  getById(@Payload() payload: MerchantByIdPayload) {
    return this.merchantService.getById(payload.merchantId);
  }

  @MessagePattern(MERCHANT_SERVICE_PATTERNS.merchantAdminList)
  getAdminMerchantList() {
    return this.merchantService.getAdminMerchantList();
  }

  @MessagePattern(MERCHANT_SERVICE_PATTERNS.merchantAdminGetOffersByMerchantId)
  getAdminOffersByMerchantId(@Payload() payload: MerchantOffersByMerchantIdPayload) {
    return this.merchantService.getAdminOffersByMerchantId(payload.merchantId);
  }

  @MessagePattern(MERCHANT_SERVICE_PATTERNS.merchantAdminGetOverviewStats)
  getAdminOverviewStats() {
    return this.merchantService.getAdminOverviewStats();
  }

  @MessagePattern(MERCHANT_SERVICE_PATTERNS.merchantGetMyOverviewStats)
  getMyOverviewStats(@Payload() payload: UserScopedPayload) {
    return this.merchantService.getMyOverviewStats(payload.userId);
  }

  @MessagePattern(MERCHANT_SERVICE_PATTERNS.merchantGetMyStatus)
  getMyStatus(@Payload() payload: UserScopedPayload) {
    return this.merchantService.getMyStatus(payload.userId);
  }

  @MessagePattern(MERCHANT_SERVICE_PATTERNS.merchantUpdateApproval)
  updateApproval(@Payload() payload: MerchantActionByIdPayload<MerchantApprovalDto>) {
    return this.merchantService.updateApproval(payload.merchantId, payload.body);
  }

  @MessagePattern(MERCHANT_SERVICE_PATTERNS.merchantUpdateSuspension)
  updateSuspension(@Payload() payload: MerchantActionByIdPayload<MerchantSuspensionDto>) {
    return this.merchantService.updateSuspension(payload.merchantId, payload.body);
  }

  @MessagePattern(MERCHANT_SERVICE_PATTERNS.merchantSetSecretCode)
  setSecretCode(@Payload() payload: UserScopedPayload<SetMerchantSecretCodeDto>) {
    return this.merchantService.setOrUpdateSecretCode(payload.userId, payload.body ?? ({} as SetMerchantSecretCodeDto));
  }
}
