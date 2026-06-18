import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { spawn } from 'node:child_process';

const MIN_VIDEO_DURATION_SECONDS = 1;
const MAX_VIDEO_DURATION_SECONDS = 30;
const DEFAULT_R2_REELS_PREFIX = 'reels/videos';

interface R2UploadConfig {
  accountId: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  publicBaseUrl?: string;
  region: string;
  objectPrefix: string;
}

type RuntimeS3Client = {
  send(command: unknown): Promise<unknown>;
};

type RuntimeS3Module = {
  S3Client: new (config: {
    region: string;
    endpoint: string;
    forcePathStyle: boolean;
    credentials: {
      accessKeyId: string;
      secretAccessKey: string;
    };
  }) => RuntimeS3Client;
  PutObjectCommand: new (input: {
    Bucket: string;
    Key: string;
    Body: Buffer;
    ContentType: string;
  }) => unknown;
};

@Injectable()
export class ReelsVideoUploadService {
  private s3Client: RuntimeS3Client | null = null;
  private s3Module: RuntimeS3Module | null = null;

  async optimizeAndUpload(userId: string, file: Express.Multer.File) {
    this.validateIncomingFile(file);

    const tempDirectory = await fs.mkdtemp(join(tmpdir(), 'reels-upload-'));
    const inputFilePath = join(tempDirectory, `source${this.resolveInputExtension(file.originalname)}`);
    const outputFilePath = join(tempDirectory, 'optimized.mp4');

    try {
      await fs.writeFile(inputFilePath, file.buffer);

      const sourceDuration = await this.readDurationSeconds(inputFilePath);
      if (sourceDuration < MIN_VIDEO_DURATION_SECONDS) {
        throw new BadRequestException(
          `Video duration must be at least ${MIN_VIDEO_DURATION_SECONDS} seconds`,
        );
      }

      await this.transcodeAndOptimize(inputFilePath, outputFilePath);

      const optimizedDuration = await this.readDurationSeconds(outputFilePath);
      if (optimizedDuration < MIN_VIDEO_DURATION_SECONDS) {
        throw new BadRequestException(
          `Video duration must be at least ${MIN_VIDEO_DURATION_SECONDS} seconds after optimization`,
        );
      }

      const durationSeconds = Math.min(MAX_VIDEO_DURATION_SECONDS, Math.round(optimizedDuration));
      const wasTrimmed = sourceDuration > MAX_VIDEO_DURATION_SECONDS;
      const uploadResult = await this.uploadOptimizedVideo(userId, outputFilePath);

      return {
        videoUrl: uploadResult.videoUrl,
        objectKey: uploadResult.objectKey,
        durationSeconds,
        wasTrimmed,
      };
    } finally {
      await fs.rm(tempDirectory, { recursive: true, force: true });
    }
  }

  private validateIncomingFile(file: Express.Multer.File | undefined): asserts file is Express.Multer.File {
    if (!file) {
      throw new BadRequestException('Video file is required');
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Uploaded video is empty');
    }

    if (!file.mimetype?.startsWith('video/')) {
      throw new BadRequestException('Only video files are allowed');
    }
  }

  private resolveInputExtension(originalName?: string): string {
    const extension = extname(originalName ?? '').toLowerCase();
    return extension || '.mp4';
  }

  private async readDurationSeconds(filePath: string): Promise<number> {
    const ffprobePath = process.env.FFPROBE_PATH?.trim() || 'ffprobe';

    const { stdout } = await this.runCommand(
      ffprobePath,
      [
        '-v',
        'error',
        '-print_format',
        'json',
        '-show_entries',
        'format=duration',
        filePath,
      ],
      'Unable to inspect uploaded video',
    );

    let parsed: unknown;
    try {
      parsed = JSON.parse(stdout);
    } catch {
      throw new BadRequestException('Unable to read video metadata');
    }

    const durationRaw =
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as Record<string, unknown>).format === 'object' &&
      (parsed as Record<string, unknown>).format !== null
        ? (parsed as { format: { duration?: string } }).format.duration
        : undefined;

    const duration = Number(durationRaw);
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new BadRequestException('Unable to determine video duration');
    }

    return duration;
  }

  private async transcodeAndOptimize(inputFilePath: string, outputFilePath: string): Promise<void> {
    const ffmpegPath = process.env.FFMPEG_PATH?.trim() || 'ffmpeg';

    await this.runCommand(
      ffmpegPath,
      [
        '-y',
        '-i',
        inputFilePath,
        '-t',
        String(MAX_VIDEO_DURATION_SECONDS),
        '-vf',
        'scale=min(1080\\,iw):-2',
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '28',
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        '-movflags',
        '+faststart',
        outputFilePath,
      ],
      'Unable to optimize uploaded video',
    );

    const outputStats = await fs.stat(outputFilePath).catch(() => null);
    if (!outputStats || outputStats.size === 0) {
      throw new InternalServerErrorException('Video optimization did not produce output');
    }
  }

  private async uploadOptimizedVideo(userId: string, outputFilePath: string) {
    const config = this.resolveR2UploadConfig();
    const s3Module = this.loadS3Module();
    const objectKey = `${config.objectPrefix}/${userId}/${Date.now()}-${randomUUID()}.mp4`;
    const fileBuffer = await fs.readFile(outputFilePath);

    await this.getS3Client(config, s3Module).send(
      new s3Module.PutObjectCommand({
        Bucket: config.bucket,
        Key: objectKey,
        Body: fileBuffer,
        ContentType: 'video/mp4',
      }),
    );

    const baseUrl = config.publicBaseUrl || config.endpoint;
    const videoUrl = `${baseUrl}/${objectKey}`;

    return {
      objectKey,
      videoUrl,
    };
  }

  private getS3Client(config: R2UploadConfig, s3Module: RuntimeS3Module): RuntimeS3Client {
    if (this.s3Client) {
      return this.s3Client;
    }

    this.s3Client = new s3Module.S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    return this.s3Client;
  }

  private loadS3Module(): RuntimeS3Module {
    if (this.s3Module) {
      return this.s3Module;
    }

    let loaded: unknown;
    try {
      loaded = eval('require')('@aws-sdk/client-s3');
    } catch {
      throw new InternalServerErrorException(
        'Missing dependency @aws-sdk/client-s3. Install dependencies before using reel uploads.',
      );
    }

    const candidate = loaded as Partial<RuntimeS3Module>;
    if (!candidate.S3Client || !candidate.PutObjectCommand) {
      throw new InternalServerErrorException('Unable to initialize Cloudflare R2 SDK client');
    }

    this.s3Module = {
      S3Client: candidate.S3Client,
      PutObjectCommand: candidate.PutObjectCommand,
    };

    return this.s3Module;
  }

  private resolveR2UploadConfig(): R2UploadConfig {
    const accountId = this.requireEnv('R2_ACCOUNT_ID');
    const bucket = this.requireEnv('R2_BUCKET');
    const accessKeyId = this.requireEnv('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.requireEnv('R2_SECRET_ACCESS_KEY');

    const endpoint = (process.env.R2_ENDPOINT?.trim() || `https://${accountId}.r2.cloudflarestorage.com`).replace(
      /\/$/,
      '',
    );
    const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim().replace(/\/$/, '') || undefined;
    const region = 'auto';
    const objectPrefix =
      process.env.R2_REELS_PREFIX?.trim().replace(/^\/+|\/+$/g, '') || DEFAULT_R2_REELS_PREFIX;

    return {
      accountId,
      bucket,
      accessKeyId,
      secretAccessKey,
      endpoint,
      publicBaseUrl,
      region,
      objectPrefix,
    };
  }

  private requireEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) {
      throw new InternalServerErrorException(`${name} is not configured`);
    }
    return value;
  }

  private runCommand(
    command: string,
    args: string[],
    failureMessage: string,
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      child.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') {
          reject(
            new InternalServerErrorException(
              `${command} binary is not available. Install ffmpeg/ffprobe or configure FFMPEG_PATH and FFPROBE_PATH.`,
            ),
          );
          return;
        }

        reject(new InternalServerErrorException(`${failureMessage}: ${error.message}`));
      });

      child.on('close', (exitCode) => {
        if (exitCode === 0) {
          resolve({ stdout, stderr });
          return;
        }

        const reason = stderr.trim() || stdout.trim() || `Exit code ${String(exitCode)}`;
        reject(new BadRequestException(`${failureMessage}: ${reason}`));
      });
    });
  }
}
