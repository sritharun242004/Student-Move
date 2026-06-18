import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { MerchantGatewayService } from './merchant-gateway.service';
import { JwtAuthGuard } from '../shared/auth/jwt-auth.guard';
import { AdminGuard } from '../shared/auth/admin.guard';
import type { AuthenticatedRequest } from '../shared/auth/authenticated-request.type';
import { MerchantGuard } from '../shared/auth/merchant.guard';

@Controller('merchants')
export class MerchantGatewayController {
  constructor(private readonly merchantGatewayService: MerchantGatewayService) {}

  @Post('upload-image')
  @UseGuards(JwtAuthGuard, MerchantGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (_request, _file, callback) => {
          const uploadRoot = process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads');
          const merchantUploadDir = join(uploadRoot, 'merchant');
          mkdirSync(merchantUploadDir, { recursive: true });
          callback(null, merchantUploadDir);
        },
        filename: (_request, file, callback) => {
          const extension = extname(file.originalname).toLowerCase();
          const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
          callback(null, fileName);
        },
      }),
      fileFilter: (_request, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(new BadRequestException('Only image files are allowed'), false);
          return;
        }
        callback(null, true);
      },
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
      },
    }),
  )
  uploadMerchantImage(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const imageUrl = `${request.protocol}://${request.get('host')}/uploads/merchant/${file.filename}`;

    return {
      imageUrl,
      fileName: file.filename,
    };
  }

  @Get('profile/me')
  @UseGuards(JwtAuthGuard, MerchantGuard)
  getMyProfile(@Req() request: AuthenticatedRequest) {
    return this.merchantGatewayService.getMyProfile(request.user.id);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getMerchants() {
    return this.merchantGatewayService.getAdminMerchantList();
  }

  @Get('admin/merchant/:merchantId/offers')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getOffersByMerchantId(@Param('merchantId') merchantId: string) {
    return this.merchantGatewayService.getAdminOffersByMerchantId(merchantId);
  }

  @Get('status/me')
  @UseGuards(JwtAuthGuard, MerchantGuard)
  getMyStatus(@Req() request: AuthenticatedRequest) {
    return this.merchantGatewayService.getMyStatus(request.user.id);
  }

  @Get(':merchantId')
  getById(@Param('merchantId') merchantId: string) {
    return this.merchantGatewayService.getById(merchantId);
  }

  @Get('stats/me')
  @UseGuards(JwtAuthGuard, MerchantGuard)
  getMyOverviewStats(@Req() request: AuthenticatedRequest) {
    return this.merchantGatewayService.getMyOverviewStats(request.user.id);
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getOverviewStats() {
    return this.merchantGatewayService.getAdminOverviewStats();
  }

  @Post('register')
  register(@Body() body: Record<string, unknown>) {
    return this.merchantGatewayService.register(body);
  }

  @Patch('profile/me')
  @UseGuards(JwtAuthGuard, MerchantGuard)
  updateMyProfile(@Req() request: AuthenticatedRequest, @Body() body: Record<string, unknown>) {
    return this.merchantGatewayService.updateMyProfile(request.user.id, body);
  }

  @Patch('profile/me/secret-code')
  @UseGuards(JwtAuthGuard, MerchantGuard )
  setOrUpdateSecretCode(@Req() request: AuthenticatedRequest, @Body() body: Record<string, unknown>) {
    return this.merchantGatewayService.setOrUpdateSecretCode(request.user.id, body);
  }

  @Patch(':merchantId/approval')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateApproval(
    @Param('merchantId') merchantId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.merchantGatewayService.updateApproval(merchantId, body);
  }

  @Patch(':merchantId/suspension')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateSuspension(
    @Param('merchantId') merchantId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.merchantGatewayService.updateSuspension(merchantId, body);
  }
}
