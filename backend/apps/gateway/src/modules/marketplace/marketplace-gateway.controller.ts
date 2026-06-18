import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MarketplaceGatewayService } from './marketplace-gateway.service';
import { MarketplacePhotoUploadService, marketplaceMulterOptions } from './marketplace-photo-upload.service';
import { AdminGuard } from '../shared/auth/admin.guard';
import type { AuthenticatedRequest } from '../shared/auth/authenticated-request.type';
import { JwtAuthGuard } from '../shared/auth/jwt-auth.guard';
import { StudentGuard } from '../shared/auth/student.guard';

@Controller('marketplace')
export class MarketplaceGatewayController {
  constructor(
    private readonly marketplaceGatewayService: MarketplaceGatewayService,
    private readonly photoUploadService: MarketplacePhotoUploadService,
  ) {}

  // ---- Photo Upload ----

  @Post('uploads/photos')
  @UseGuards(JwtAuthGuard, StudentGuard)
  @UseInterceptors(FilesInterceptor('photos', 5, marketplaceMulterOptions))
  uploadPhotos(
    @Req() request: AuthenticatedRequest,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one photo file is required');
    }
    return files.map((file) => ({
      photoUrl: this.photoUploadService.getPhotoUrl(request, file.filename),
      fileName: file.filename,
    }));
  }

  // ---- Categories ----

  @Get('categories')
  listCategories() {
    return this.marketplaceGatewayService.listCategories();
  }

  // ---- Listings ----

  @Post('listings')
  @UseGuards(JwtAuthGuard, StudentGuard)
  createListing(
    @Req() request: AuthenticatedRequest,
    @Body() body: Record<string, unknown>,
  ) {
    return this.marketplaceGatewayService.createListing(request.user.id, body);
  }

  @Get('listings/mine')
  @UseGuards(JwtAuthGuard, StudentGuard)
  getMyListings(@Req() request: AuthenticatedRequest) {
    return this.marketplaceGatewayService.getMyListings(request.user.id);
  }

  @Get('listings')
  browseListings(@Query() query: Record<string, unknown>) {
    return this.marketplaceGatewayService.browseListings(query);
  }

  @Get('listings/:listingId')
  getListingById(@Param('listingId') listingId: string) {
    return this.marketplaceGatewayService.getListingById(listingId);
  }

  @Patch('listings/:listingId')
  @UseGuards(JwtAuthGuard, StudentGuard)
  updateListing(
    @Req() request: AuthenticatedRequest,
    @Param('listingId') listingId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.marketplaceGatewayService.updateListing(request.user.id, listingId, body);
  }

  @Delete('listings/:listingId')
  @UseGuards(JwtAuthGuard, StudentGuard)
  deleteListing(
    @Req() request: AuthenticatedRequest,
    @Param('listingId') listingId: string,
  ) {
    return this.marketplaceGatewayService.deleteListing(request.user.id, listingId);
  }

  @Patch('listings/:listingId/status')
  @UseGuards(JwtAuthGuard, StudentGuard)
  updateListingStatus(
    @Req() request: AuthenticatedRequest,
    @Param('listingId') listingId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.marketplaceGatewayService.updateListingStatus(request.user.id, listingId, body);
  }

  // ---- Conversations ----

  @Post('listings/:listingId/conversations')
  @UseGuards(JwtAuthGuard, StudentGuard)
  createConversation(
    @Req() request: AuthenticatedRequest,
    @Param('listingId') listingId: string,
  ) {
    return this.marketplaceGatewayService.createConversation(request.user.id, listingId);
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard, StudentGuard)
  listMyConversations(@Req() request: AuthenticatedRequest) {
    return this.marketplaceGatewayService.listMyConversations(request.user.id);
  }

  @Get('conversations/unread-count')
  @UseGuards(JwtAuthGuard, StudentGuard)
  getUnreadConversationCount(@Req() request: AuthenticatedRequest) {
    return this.marketplaceGatewayService.getUnreadConversationCount(request.user.id);
  }

  @Get('conversations/:conversationId')
  @UseGuards(JwtAuthGuard, StudentGuard)
  getConversationById(
    @Req() request: AuthenticatedRequest,
    @Param('conversationId') conversationId: string,
  ) {
    return this.marketplaceGatewayService.getConversationById(request.user.id, conversationId);
  }

  @Get('conversations/:conversationId/messages')
  @UseGuards(JwtAuthGuard, StudentGuard)
  listMessages(
    @Req() request: AuthenticatedRequest,
    @Param('conversationId') conversationId: string,
  ) {
    return this.marketplaceGatewayService.listMessages(request.user.id, conversationId);
  }

  @Post('conversations/:conversationId/messages')
  @UseGuards(JwtAuthGuard, StudentGuard)
  sendMessage(
    @Req() request: AuthenticatedRequest,
    @Param('conversationId') conversationId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.marketplaceGatewayService.sendMessage(request.user.id, conversationId, body);
  }

  @Patch('conversations/:conversationId/messages/read')
  @UseGuards(JwtAuthGuard, StudentGuard)
  markMessagesAsRead(
    @Req() request: AuthenticatedRequest,
    @Param('conversationId') conversationId: string,
  ) {
    return this.marketplaceGatewayService.markMessagesAsRead(request.user.id, conversationId);
  }

  // ---- Admin ----

  @Get('admin/listings')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminListListings() {
    return this.marketplaceGatewayService.adminListListings();
  }

  @Delete('admin/listings/:listingId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminRemoveListing(@Param('listingId') listingId: string) {
    return this.marketplaceGatewayService.adminRemoveListing(listingId);
  }
}
