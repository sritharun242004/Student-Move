import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { MERCHANT_SERVICE_PATTERNS } from '@app/contracts';

@Controller()
export class HealthRpcController {
  @MessagePattern(MERCHANT_SERVICE_PATTERNS.healthPing)
  ping(): { status: string; service: string } {
    return { status: 'ok', service: 'merchant-service' };
  }
}
