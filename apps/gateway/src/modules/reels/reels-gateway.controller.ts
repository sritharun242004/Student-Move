import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ReelsGatewayService } from './reels-gateway.service';
import { AdminGuard } from '../shared/auth/admin.guard';
import type { AuthenticatedRequest } from '../shared/auth/authenticated-request.type';
import { JwtAuthGuard } from '../shared/auth/jwt-auth.guard';
import { ReelUserGuard } from '../shared/auth/reel-user.guard';

const DEFAULT_MAX_VIDEO_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB

function resolveVideoUploadLimit(): number {
  const configuredLimit = Number(process.env.REELS_VIDEO_MAX_UPLOAD_BYTES ?? '');
  if (Number.isFinite(configuredLimit) && configuredLimit > 0) {
    return configuredLimit;
  }

  return DEFAULT_MAX_VIDEO_UPLOAD_BYTES;
}

@Controller('reels')
export class ReelsGatewayController {
  constructor(private readonly reelsGatewayService: ReelsGatewayService) {}

  @Get('profile/me')
  @UseGuards(JwtAuthGuard, ReelUserGuard)
  getMyProfile(@Req() request: AuthenticatedRequest) {
    return this.reelsGatewayService.getMyProfile(request.user.id);
  }

  @Get('profiles/search')
  @UseGuards(JwtAuthGuard)
  searchProfiles(
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ) {
    if (!q?.trim()) {
      throw new BadRequestException('q is required');
    }
    const parsedLimit = limit ? Number(limit) : undefined;
    return this.reelsGatewayService.searchProfiles(q.trim(), parsedLimit);
  }

  @Patch('profile/me')
  @UseGuards(JwtAuthGuard, ReelUserGuard)
  updateMyProfile(@Req() request: AuthenticatedRequest, @Body() body: Record<string, unknown>) {
    return this.reelsGatewayService.updateMyProfile(request.user.id, body);
  }

  @Get('profile/:studentId')
  @UseGuards(JwtAuthGuard)
  getProfileByStudentId(
    @Req() request: AuthenticatedRequest,
    @Param('studentId') studentId: string,
  ) {
    return this.reelsGatewayService.getProfileByStudentId(studentId, request.user.id);
  }

  @Post('profile/:studentId/follow')
  @UseGuards(JwtAuthGuard, ReelUserGuard)
  followStudent(@Req() request: AuthenticatedRequest, @Param('studentId') studentId: string) {
    return this.reelsGatewayService.followStudent(request.user.id, studentId);
  }

  @Delete('profile/:studentId/follow')
  @UseGuards(JwtAuthGuard, ReelUserGuard)
  unfollowStudent(@Req() request: AuthenticatedRequest, @Param('studentId') studentId: string) {
    return this.reelsGatewayService.unfollowStudent(request.user.id, studentId);
  }

  @Get('profile/:studentId/followers')
  @UseGuards(JwtAuthGuard)
  getFollowers(@Req() request: AuthenticatedRequest, @Param('studentId') studentId: string) {
    const isAdmin = request.user.role === 'admin';
    if (!isAdmin && String(request.user.id) !== studentId) {
      throw new ForbiddenException('You can only view your own followers');
    }
    return this.reelsGatewayService.getFollowers(studentId);
  }

  @Get('profile/:studentId/following')
  @UseGuards(JwtAuthGuard)
  getFollowing(@Req() request: AuthenticatedRequest, @Param('studentId') studentId: string) {
    const isAdmin = request.user.role === 'admin';
    if (!isAdmin && String(request.user.id) !== studentId) {
      throw new ForbiddenException('You can only view your own following list');
    }
    return this.reelsGatewayService.getFollowing(studentId);
  }

  @Patch('admin/profile/:studentId/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateStudentStatus(
    @Param('studentId') studentId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.reelsGatewayService.updateStudentStatus(studentId, body);
  }

  @Get('admin/profiles')
  @UseGuards(JwtAuthGuard, AdminGuard)
  listAdminStudentProfiles(@Query() query: Record<string, unknown>) {
    return this.reelsGatewayService.listAdminStudentProfiles(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard, ReelUserGuard)
  createReel(@Req() request: AuthenticatedRequest, @Body() body: Record<string, unknown>) {
    return this.reelsGatewayService.createReel(request.user.id, body);
  }

  @Post('upload-video')
  @UseGuards(JwtAuthGuard, ReelUserGuard)
  @UseInterceptors(
    FileInterceptor('video', {
      storage: memoryStorage(),
      fileFilter: (_request, file, callback) => {
        if (!file.mimetype.startsWith('video/')) {
          callback(new BadRequestException('Only video files are allowed'), false);
          return;
        }
        callback(null, true);
      },
      limits: {
        fileSize: resolveVideoUploadLimit(),
      },
    }),
  )
  uploadVideo(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.reelsGatewayService.uploadVideo(request.user.id, file);
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  getFeed(@Req() request: AuthenticatedRequest, @Query() query: Record<string, unknown>) {
    return this.reelsGatewayService.getFeed(request.user.id, query);
  }

  @Get('public-feed')
  getPublicFeed(@Query() query: Record<string, unknown>) {
    return this.reelsGatewayService.getFeed(undefined, query);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  listAdminReels(@Query() query: Record<string, unknown>) {
    return this.reelsGatewayService.listAdminReels(query);
  }

  @Patch('admin/:reelId/flag')
  @UseGuards(JwtAuthGuard, AdminGuard)
  flagReel(@Param('reelId') reelId: string, @Body() body: Record<string, unknown>) {
    return this.reelsGatewayService.flagReel(reelId, body);
  }

  @Delete('admin/:reelId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminDeleteReel(@Param('reelId') reelId: string) {
    return this.reelsGatewayService.adminDeleteReel(reelId);
  }

  @Get('admin/reports')
  @UseGuards(JwtAuthGuard, AdminGuard)
  listAdminReports() {
    return this.reelsGatewayService.listAdminReports();
  }

  @Patch('admin/reports/:reportId/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateReportStatus(
    @Param('reportId') reportId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.reelsGatewayService.updateReportStatus(reportId, String(body.status ?? ''));
  }

  @Delete('admin/reports/:reportId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  deleteReport(@Param('reportId') reportId: string) {
    return this.reelsGatewayService.deleteReport(reportId);
  }

  @Get(':reelId')
  @UseGuards(JwtAuthGuard)
  getReelById(@Req() request: AuthenticatedRequest, @Param('reelId') reelId: string) {
    return this.reelsGatewayService.getReelById(reelId, request.user.id);
  }

  @Delete(':reelId')
  @UseGuards(JwtAuthGuard, ReelUserGuard)
  deleteMyReel(@Req() request: AuthenticatedRequest, @Param('reelId') reelId: string) {
    return this.reelsGatewayService.deleteMyReel(request.user.id, reelId);
  }

  @Post(':reelId/like')
  @UseGuards(JwtAuthGuard, ReelUserGuard)
  likeReel(@Req() request: AuthenticatedRequest, @Param('reelId') reelId: string) {
    return this.reelsGatewayService.likeReel(request.user.id, reelId);
  }

  @Delete(':reelId/like')
  @UseGuards(JwtAuthGuard, ReelUserGuard)
  unlikeReel(@Req() request: AuthenticatedRequest, @Param('reelId') reelId: string) {
    return this.reelsGatewayService.unlikeReel(request.user.id, reelId);
  }

  @Post(':reelId/comments')
  @UseGuards(JwtAuthGuard, ReelUserGuard)
  commentOnReel(
    @Req() request: AuthenticatedRequest,
    @Param('reelId') reelId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.reelsGatewayService.commentOnReel(request.user.id, reelId, body);
  }

  @Post(':reelId/share')
  @UseGuards(JwtAuthGuard, ReelUserGuard)
  shareReel(@Req() request: AuthenticatedRequest, @Param('reelId') reelId: string) {
    return this.reelsGatewayService.shareReel(request.user.id, reelId);
  }

  @Delete(':reelId/share')
  @UseGuards(JwtAuthGuard, ReelUserGuard)
  unshareReel(@Req() request: AuthenticatedRequest, @Param('reelId') reelId: string) {
    return this.reelsGatewayService.unshareReel(request.user.id, reelId);
  }

  @Post(':reelId/report')
  @UseGuards(JwtAuthGuard, ReelUserGuard)
  reportReel(
    @Req() request: AuthenticatedRequest,
    @Param('reelId') reelId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.reelsGatewayService.reportReel(request.user.id, reelId, body);
  }

  @Get(':reelId/comments')
  @UseGuards(JwtAuthGuard)
  getReelComments(@Param('reelId') reelId: string) {
    return this.reelsGatewayService.getReelComments(reelId);
  }

  @Delete(':reelId/comments/:commentId')
  @UseGuards(JwtAuthGuard)
  deleteComment(
    @Req() request: AuthenticatedRequest,
    @Param('reelId') reelId: string,
    @Param('commentId') commentId: string,
  ) {
    const isAdmin = request.user.role === 'admin';
    return this.reelsGatewayService.deleteComment(request.user.id, reelId, commentId, isAdmin);
  }

  @Get(':reelId/likes')
  @UseGuards(JwtAuthGuard)
  getReelLikes(@Param('reelId') reelId: string) {
    return this.reelsGatewayService.getReelLikes(reelId);
  }
}
