import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { RedemptionGatewayService } from './redemption-gateway.service';
import { JwtAuthGuard } from '../shared/auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../shared/auth/authenticated-request.type';

@Controller('redemptions')
export class RedemptionGatewayController {
  constructor(private readonly redemptionGatewayService: RedemptionGatewayService) {}

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  validateVoucher(@Req() request: AuthenticatedRequest, @Body() body: Record<string, unknown>) {
    return this.redemptionGatewayService.validateVoucher(request.user.id, body);
  }

  @Get('activity/me')
  @UseGuards(JwtAuthGuard)
  getActivity(@Req() request: AuthenticatedRequest) {
    return this.redemptionGatewayService.getActivity(request.user.id);
  }
}
