import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PostgresDbModule } from '@app/postgres-db';
import { NotificationModule } from '@app/notifications';
import { HealthRpcController } from './shared/health.rpc.controller';
import { ListingModule } from './listing/listing.module';
import { ConversationModule } from './conversation/conversation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PostgresDbModule.forRoot(),
    NotificationModule,
    ListingModule,
    ConversationModule,
  ],
  controllers: [HealthRpcController],
})
export class MarketplaceServiceModule {}
