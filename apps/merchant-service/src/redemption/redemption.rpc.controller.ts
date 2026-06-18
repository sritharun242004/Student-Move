import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MERCHANT_SERVICE_PATTERNS } from '@app/contracts';
import type { RedemptionValidatePayload, UserScopedPayload } from '@app/contracts';
import { ValidateVoucherDto } from './redemption.dto';
import { RedemptionService } from './redemption.service';

@Controller()
export class RedemptionRpcController {
  constructor(private readonly redemptionService: RedemptionService) {}

  @MessagePattern(MERCHANT_SERVICE_PATTERNS.redemptionValidateAndRedeem)
  validateAndRedeem(@Payload() payload: RedemptionValidatePayload) {
    return this.redemptionService.validateAndRedeem(payload.userId, {
      uniqueCode: payload.uniqueCode,
      merchantSecretCode: payload.merchantSecretCode,
    } as ValidateVoucherDto);
  }

  @MessagePattern(MERCHANT_SERVICE_PATTERNS.redemptionGetMerchantActivity)
  getMerchantActivity(@Payload() payload: UserScopedPayload) {
    return this.redemptionService.getMerchantActivity(payload.userId);
  }
}
