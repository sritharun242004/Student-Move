import { Injectable } from '@nestjs/common';
import { MerchantServiceClient } from '../../microservices/merchant-service.client';

@Injectable()
export class RedemptionGatewayService {
  constructor(private readonly merchantClient: MerchantServiceClient) {}

  validateVoucher(userId: string, body: Record<string, unknown>) {
    const merchantSecretCode =
      typeof body.merchantSecretCode === 'string' ? body.merchantSecretCode : undefined;

    return this.merchantClient.validateAndRedeem({
      userId,
      uniqueCode: String(body.uniqueCode ?? ''),
      merchantSecretCode,
    });
  }

  getActivity(userId: string) {
    return this.merchantClient.getMerchantActivity({ userId });
  }
}
