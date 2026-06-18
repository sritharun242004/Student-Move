import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { MARKETPLACE_SERVICE_PATTERNS } from '@app/contracts';

@Controller()
export class HealthRpcController {
  @MessagePattern(MARKETPLACE_SERVICE_PATTERNS.healthPing)
  ping(): { status: string; service: string } {
    return { status: 'ok', service: 'marketplace-service' };
  }
}
