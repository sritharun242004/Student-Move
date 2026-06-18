import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MARKETPLACE_SERVICE_CLIENT, MarketplaceServiceClient } from './marketplace-service.client';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: MARKETPLACE_SERVICE_CLIENT,
        transport: Transport.TCP,
        options: {
          host: process.env.MARKETPLACE_TCP_HOST ?? 'localhost',
          port: Number(process.env.MARKETPLACE_TCP_PORT ?? 4103),
        },
      },
    ]),
  ],
  providers: [MarketplaceServiceClient],
  exports: [MarketplaceServiceClient],
})
export class MarketplaceServiceClientModule {}
