import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantModule } from '../merchant/merchant.module';
import { Offer } from '../domain/entities/offer.entity';
import { Voucher } from '../domain/entities/voucher.entity';
import { OfferRpcController } from './offer.rpc.controller';
import { OfferService } from './offer.service';

@Module({
  imports: [TypeOrmModule.forFeature([Offer, Voucher]), MerchantModule],
  controllers: [OfferRpcController],
  providers: [OfferService],
  exports: [OfferService, TypeOrmModule],
})
export class OfferModule {}
