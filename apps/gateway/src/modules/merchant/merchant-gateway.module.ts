import { Module } from '@nestjs/common';
import { MerchantServiceClientModule } from '../../microservices/merchant-service.client.module';
import { MerchantGatewayController } from './merchant-gateway.controller';
import { MerchantGatewayService } from './merchant-gateway.service';

@Module({
  imports: [MerchantServiceClientModule],
  controllers: [MerchantGatewayController],
  providers: [MerchantGatewayService],
})
export class MerchantGatewayModule {}
