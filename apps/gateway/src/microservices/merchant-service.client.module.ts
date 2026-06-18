import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MerchantServiceClient, MERCHANT_SERVICE_CLIENT } from './merchant-service.client';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: MERCHANT_SERVICE_CLIENT,
        transport: Transport.TCP,
        options: {
          host: process.env.MERCHANT_TCP_HOST ?? 'localhost',
          port: Number(process.env.MERCHANT_TCP_PORT ?? 4101),
        },
      },            
    ]),
  ],
  providers: [MerchantServiceClient],
  exports: [MerchantServiceClient],
})
export class MerchantServiceClientModule {}
