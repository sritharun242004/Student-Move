import { Module } from '@nestjs/common';
import { MerchantServiceClientModule } from '../../microservices/merchant-service.client.module';
import { OfferGatewayController } from './offer-gateway.controller';
import { OfferGatewayService } from './offer-gateway.service';

@Module({
  imports: [MerchantServiceClientModule],
  controllers: [OfferGatewayController],
  providers: [OfferGatewayService],
})
export class OfferGatewayModule {}
