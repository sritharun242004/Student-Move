import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { REELS_SERVICE_CLIENT, ReelsServiceClient } from './reels-service.client';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: REELS_SERVICE_CLIENT,
        transport: Transport.TCP,
        options: {
          host: process.env.REELS_TCP_HOST ?? 'localhost',
          port: Number(process.env.REELS_TCP_PORT ?? 4102),
        },
      },
    ]),
  ],
  providers: [ReelsServiceClient],
  exports: [ReelsServiceClient],
})
export class ReelsServiceClientModule {}
