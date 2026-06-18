import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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
import { extname, join } from 'node:path';
import { OfferGatewayService } from './offer-gateway.service';
import { JwtAuthGuard } from '../shared/auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../shared/auth/authenticated-request.type';
import { MerchantGuard } from '../shared/auth/merchant.guard';

@Controller('offers')
export class OfferGatewayController {
  constructor(private readonly offerGatewayService: OfferGatewayService) {}
 
  @Post('upload-image')
  @UseGuards(JwtAuthGuard, MerchantGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads'),
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
  uploadOfferImage(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const imageUrl = `${request.protocol}://${request.get('host')}/uploads/${file.filename}`;

    return {
      imageUrl,
      fileName: file.filename,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, MerchantGuard)
  createOffer(@Req() request: AuthenticatedRequest, @Body() body: Record<string, unknown>) {
    return this.offerGatewayService.createOffer(request.user.id, body);
  }

  @Patch(':offerId')
  @UseGuards(JwtAuthGuard, MerchantGuard)
  updateOffer(
    @Req() request: AuthenticatedRequest,
    @Param('offerId') offerId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.offerGatewayService.updateOffer(request.user.id, offerId, body);
  }

  @Patch(':offerId/activation')
  @UseGuards(JwtAuthGuard, MerchantGuard)
  toggleOffer(
    @Req() request: AuthenticatedRequest,
    @Param('offerId') offerId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.offerGatewayService.toggleOffer(request.user.id, offerId, body);
  }

  @Delete(':offerId')
  @UseGuards(JwtAuthGuard, MerchantGuard)
  deleteOffer(@Req() request: AuthenticatedRequest, @Param('offerId') offerId: string) {
    return this.offerGatewayService.deleteOffer(request.user.id, offerId);
  }

  @Get('active')
  getActiveOffers() {
    return this.offerGatewayService.getActiveOffers();
  }

  @Get('merchant/me')
  @UseGuards(JwtAuthGuard, MerchantGuard)
  getMerchantOffers(@Req() request: AuthenticatedRequest) {
    return this.offerGatewayService.getMerchantOffers(request.user.id);
  }

  @Get('student/redeemed/me')
  @UseGuards(JwtAuthGuard)
  getMyRedeemedOffers(@Req() request: AuthenticatedRequest) {
    return this.offerGatewayService.getRedeemedOffersForStudent(request.user.id);
  }

  @Get('student/:studentId/redeemed')
  getStudentRedeemedOffers(@Param('studentId') studentId: string) {
    return this.offerGatewayService.getRedeemedOffersForStudent(studentId);
  }
}
