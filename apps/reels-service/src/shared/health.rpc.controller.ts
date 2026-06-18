import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { REELS_SERVICE_PATTERNS } from '@app/contracts';

@Controller()
export class HealthRpcController {
  @MessagePattern(REELS_SERVICE_PATTERNS.healthPing)
  ping(): { status: string; service: string } {
    return { status: 'ok', service: 'reels-service' };
  }
}
