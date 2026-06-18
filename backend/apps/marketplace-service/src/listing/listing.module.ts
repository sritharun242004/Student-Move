import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../domain/entities/category.entity';
import { Listing } from '../domain/entities/listing.entity';
import { ListingPhoto } from '../domain/entities/listing-photo.entity';
import { ListingRpcController } from './listing.rpc.controller';
import { ListingService } from './listing.service';

@Module({
  imports: [TypeOrmModule.forFeature([Listing, ListingPhoto, Category])],
  controllers: [ListingRpcController],
  providers: [ListingService],
})
export class ListingModule {}
