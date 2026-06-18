import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MERCHANT_SERVICE_PATTERNS } from '@app/contracts';
import type { UserScopedPayload } from '@app/contracts';
import type { CreateVoucherDto } from './voucher.dto';
import { VoucherService } from './voucher.service';

@Controller()
export class VoucherRpcController {
  constructor(private readonly voucherService: VoucherService) {}

  @MessagePattern(MERCHANT_SERVICE_PATTERNS.voucherCreate)
  createVoucher(@Payload() payload: UserScopedPayload<CreateVoucherDto>) {
    return this.voucherService.createVoucher(payload.userId, payload.body as CreateVoucherDto);
  }
}
