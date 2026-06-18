import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { MarketplaceServiceModule } from './marketplace-service.module';
import { HttpToRpcExceptionFilter } from './shared/filters/http-rpc-exception.filter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(MarketplaceServiceModule, {
    transport: Transport.TCP,
    options: {
      host: process.env.MARKETPLACE_TCP_HOST ?? '0.0.0.0',
      port: Number(process.env.MARKETPLACE_TCP_PORT ?? 4103),
    },
  });

  app.useGlobalFilters(new HttpToRpcExceptionFilter());
  await app.listen();
}

bootstrap();
