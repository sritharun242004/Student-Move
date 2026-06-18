import { BadRequestException, Injectable } from '@nestjs/common';
import { diskStorage } from 'multer';
import { mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import type { Request } from 'express';

export const marketplaceMulterOptions = {
  storage: diskStorage({
    destination: (_request: Request, _file: Express.Multer.File, callback: (error: Error | null, destination: string) => void) => {
      const uploadRoot = process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads');
      const dir = join(uploadRoot, 'marketplace');
      mkdirSync(dir, { recursive: true });
      callback(null, dir);
    },
    filename: (_request: Request, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) => {
      const extension = extname(file.originalname).toLowerCase();
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
      callback(null, fileName);
    },
  }),
  fileFilter: (
    _request: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(new BadRequestException('Only image files are allowed'), false);
      return;
    }
    callback(null, true);
  },
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB per file
    files: 5,                  // max 5 files per request
  },
};

@Injectable()
export class MarketplacePhotoUploadService {
  getPhotoUrl(request: Request, filename: string): string {
    return `${request.protocol}://${request.get('host')}/uploads/marketplace/${filename}`;
  }
}
