import { Injectable } from '@nestjs/common';
import { MerchantServiceClient } from '../../microservices/merchant-service.client';

@Injectable()
export class VoucherGatewayService {
  constructor(private readonly merchantClient: MerchantServiceClient) {}

  createVoucher(userId: string, body: Record<string, unknown>) {
    return this.merchantClient.createVoucher({ userId, body });
  }
}
