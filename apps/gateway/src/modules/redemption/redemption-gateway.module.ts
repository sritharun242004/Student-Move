import { Module } from '@nestjs/common';
import { MerchantServiceClientModule } from '../../microservices/merchant-service.client.module';
import { RedemptionGatewayController } from './redemption-gateway.controller';
import { RedemptionGatewayService } from './redemption-gateway.service';

@Module({
  imports: [MerchantServiceClientModule],
  controllers: [RedemptionGatewayController],
  providers: [RedemptionGatewayService],
})
export class RedemptionGatewayModule {}
