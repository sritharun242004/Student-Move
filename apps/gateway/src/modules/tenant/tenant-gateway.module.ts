import { Module } from '@nestjs/common';
import { TenantGatewayController } from './tenant-gateway.controller';

@Module({
  controllers: [TenantGatewayController],
})
export class TenantGatewayModule {}
