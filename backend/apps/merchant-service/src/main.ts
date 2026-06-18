import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { MerchantServiceModule } from './merchant-service.module';
import { HttpToRpcExceptionFilter } from './shared/filters/http-rpc-exception.filter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    MerchantServiceModule,
    {
    transport: Transport.TCP,
    options: {
      host: process.env.MERCHANT_TCP_HOST ?? '0.0.0.0',
      port: Number(process.env.MERCHANT_TCP_PORT ?? 4101),
    },
    },
  );

  app.useGlobalFilters(new HttpToRpcExceptionFilter());

  await app.listen();
}
bootstrap();
