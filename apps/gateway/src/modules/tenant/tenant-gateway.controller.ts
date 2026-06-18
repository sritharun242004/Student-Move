import {
  BadRequestException,
  Controller,
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
import { JwtAuthGuard } from '../shared/auth/jwt-auth.guard';
import { StudentGuard } from '../shared/auth/student.guard';
import type { AuthenticatedRequest } from '../shared/auth/authenticated-request.type';

@Controller('tenants')
export class TenantGatewayController {
  @Post('upload-image')
  @UseGuards(JwtAuthGuard, StudentGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (_request, _file, callback) => {
          const uploadRoot = process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads');
          const tenantUploadDir = join(uploadRoot, 'tenant');
          mkdirSync(tenantUploadDir, { recursive: true });
          callback(null, tenantUploadDir);
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
        fileSize: 2 * 1024 * 1024,
      },
    }),
  )
  uploadTenantImage(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const imageUrl = `${request.protocol}://${request.get('host')}/uploads/tenant/${file.filename}`;

    return {
      imageUrl,
      fileName: file.filename,
    };
  }
}
