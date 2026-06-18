import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PostgresDbModule } from '@app/postgres-db';
import { MailerModule } from '@app/mailer';
import { NotificationModule } from '@app/notifications';
import { HealthRpcController } from './shared/health.rpc.controller';
import { MerchantModule } from './merchant/merchant.module';
import { OfferModule } from './offer/offer.module';
import { VoucherModule } from './voucher/voucher.module';
import { RedemptionModule } from './redemption/redemption.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PostgresDbModule.forRoot(),
    MailerModule,
    NotificationModule,
    MerchantModule,
    OfferModule,
    VoucherModule,
    RedemptionModule,
  ],
  controllers: [HealthRpcController],
})
export class MerchantServiceModule {}
