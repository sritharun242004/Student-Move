import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offer } from '../domain/entities/offer.entity';
import { Voucher } from '../domain/entities/voucher.entity';
import { VoucherRpcController } from './voucher.rpc.controller';
import { VoucherService } from './voucher.service';

@Module({
  imports: [TypeOrmModule.forFeature([Offer, Voucher])],
  controllers: [VoucherRpcController],
  providers: [VoucherService],
  exports: [VoucherService, TypeOrmModule],
})
export class VoucherModule {}
