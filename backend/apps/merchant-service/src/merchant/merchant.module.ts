import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantProfile } from '../domain/entities/merchant-profile.entity';
import { Offer } from '../domain/entities/offer.entity';
import { RedemptionRecord } from '../domain/entities/redemption-record.entity';
import { Voucher } from '../domain/entities/voucher.entity';
import { MerchantRpcController } from './merchant.rpc.controller';
import { MerchantService } from './merchant.service';

@Module({
  imports: [TypeOrmModule.forFeature([MerchantProfile, Offer, Voucher, RedemptionRecord])],
  controllers: [MerchantRpcController],
  providers: [MerchantService],
  exports: [MerchantService, TypeOrmModule],
})
export class MerchantModule {}
