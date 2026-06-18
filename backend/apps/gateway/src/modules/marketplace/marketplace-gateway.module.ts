import { Module } from '@nestjs/common';
import { MarketplaceServiceClientModule } from '../../microservices/marketplace-service.client.module';
import { ReelsServiceClientModule } from '../../microservices/reels-service.client.module';
import { MarketplaceGatewayController } from './marketplace-gateway.controller';
import { MarketplaceGatewayService } from './marketplace-gateway.service';
import { MarketplacePhotoUploadService } from './marketplace-photo-upload.service';

@Module({
  imports: [MarketplaceServiceClientModule, ReelsServiceClientModule],
  controllers: [MarketplaceGatewayController],
  providers: [MarketplaceGatewayService, MarketplacePhotoUploadService],
})
export class MarketplaceGatewayModule {}
