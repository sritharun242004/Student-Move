import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReelComment } from '../domain/entities/reel-comment.entity';
import { ReelLike } from '../domain/entities/reel-like.entity';
import { ReelReport } from '../domain/entities/reel-report.entity';
import { ReelShare } from '../domain/entities/reel-share.entity';
import { Reel } from '../domain/entities/reel.entity';
import { StudentFollow } from '../domain/entities/student-follow.entity';
import { StudentProfile } from '../domain/entities/student-profile.entity';
import { ReelsRpcController } from './reels.rpc.controller';
import { ReelsService } from './reels.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentProfile,
      Reel,
      StudentFollow,
      ReelLike,
      ReelComment,
      ReelShare,
      ReelReport,
    ]),
  ],
  controllers: [ReelsRpcController],
  providers: [ReelsService],
  exports: [ReelsService],
})
export class ReelsModule {}
