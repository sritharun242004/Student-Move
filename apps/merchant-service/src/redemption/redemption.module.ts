import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantModule } from '../merchant/merchant.module';
import { RedemptionRecord } from '../domain/entities/redemption-record.entity';
import { Voucher } from '../domain/entities/voucher.entity';
import { RedemptionRpcController } from './redemption.rpc.controller';
import { RedemptionService } from './redemption.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Voucher, RedemptionRecord]),
    MerchantModule,
  ],
  controllers: [RedemptionRpcController],
  providers: [RedemptionService],
})
export class RedemptionModule {}
