import { Module } from '@nestjs/common';
import { MerchantServiceClientModule } from '../../microservices/merchant-service.client.module';
import { VoucherGatewayController } from './voucher-gateway.controller';
import { VoucherGatewayService } from './voucher-gateway.service';

@Module({
  imports: [MerchantServiceClientModule],
  controllers: [VoucherGatewayController],
  providers: [VoucherGatewayService],
})
export class VoucherGatewayModule {}
