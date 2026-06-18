import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ReelsServiceModule } from './reels-service.module';
import { HttpToRpcExceptionFilter } from './shared/filters/http-rpc-exception.filter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(ReelsServiceModule, {
    transport: Transport.TCP,
    options: {
      host: process.env.REELS_TCP_HOST ?? '0.0.0.0',
      port: Number(process.env.REELS_TCP_PORT ?? 4102),
    },
  });

  app.useGlobalFilters(new HttpToRpcExceptionFilter());
  await app.listen();
}

bootstrap();
