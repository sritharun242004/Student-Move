import { Module } from '@nestjs/common';
import { ReelsServiceClientModule } from '../../microservices/reels-service.client.module';
import { ReelsGatewayController } from './reels-gateway.controller';
import { ReelsGatewayService } from './reels-gateway.service';
import { ReelsVideoUploadService } from './reels-video-upload.service';

@Module({
  imports: [ReelsServiceClientModule],
  controllers: [ReelsGatewayController],
  providers: [ReelsGatewayService, ReelsVideoUploadService],
})
export class ReelsGatewayModule {}
