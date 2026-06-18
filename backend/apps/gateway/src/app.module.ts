import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MerchantGatewayModule } from './modules/merchant/merchant-gateway.module';
import { OfferGatewayModule } from './modules/offer/offer-gateway.module';
import { VoucherGatewayModule } from './modules/voucher/voucher-gateway.module';
import { RedemptionGatewayModule } from './modules/redemption/redemption-gateway.module';
import { ReelsGatewayModule } from './modules/reels/reels-gateway.module';
import { TenantGatewayModule } from './modules/tenant/tenant-gateway.module';
import { MarketplaceGatewayModule } from './modules/marketplace/marketplace-gateway.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtStrategy } from './modules/shared/auth/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MerchantGatewayModule,
    OfferGatewayModule,
    VoucherGatewayModule,
    RedemptionGatewayModule,
    ReelsGatewayModule,
    TenantGatewayModule,
    MarketplaceGatewayModule,
  ],
  providers: [AppService, JwtStrategy],
  controllers: [AppController]
})
export class AppModule {}
