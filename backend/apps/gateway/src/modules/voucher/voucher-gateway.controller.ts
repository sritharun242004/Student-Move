import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { VoucherGatewayService } from './voucher-gateway.service';
import { JwtAuthGuard } from '../shared/auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../shared/auth/authenticated-request.type';

@Controller('vouchers')
export class VoucherGatewayController {
  constructor(private readonly voucherGatewayService: VoucherGatewayService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createVoucher(@Req() request: AuthenticatedRequest, @Body() body: Record<string, unknown>) {
    return this.voucherGatewayService.createVoucher(request.user.id, body);
  }
}
