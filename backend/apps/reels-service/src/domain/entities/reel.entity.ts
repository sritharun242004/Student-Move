import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReelComment } from './reel-comment.entity';
import { ReelLike } from './reel-like.entity';
import { ReelReport } from './reel-report.entity';
import { ReelShare } from './reel-share.entity';
import { StudentProfile } from './student-profile.entity';

@Entity({ name: 'reels' })
export class Reel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  creatorId!: string;

  @ManyToOne(() => StudentProfile, (profile) => profile.reels, { onDelete: 'CASCADE' })
  creator!: StudentProfile;

  @Column({ type: 'text' })
  videoUrl!: string;

  @Column({ type: 'integer' })
  durationSeconds!: number;

  @Column({ type: 'boolean', default: false })
  wasTrimmed!: boolean;

  @Column({ type: 'text', nullable: true })
  caption?: string;

  @Column({ type: 'text', array: true, default: '{}' })
  tags!: string[];

  @Column({ type: 'integer', default: 0 })
  likesCount!: number;

  @Column({ type: 'integer', default: 0 })
  commentsCount!: number;

  @Column({ type: 'integer', default: 0 })
  sharesCount!: number;

  @Column({ type: 'float8', default: 0 })
  popularityScore!: number;

  @Column({ type: 'boolean', default: false })
  isFlagged!: boolean;

  @OneToMany(() => ReelLike, (like) => like.reel)
  likes!: ReelLike[];

  @OneToMany(() => ReelComment, (comment) => comment.reel)
  comments!: ReelComment[];

  @OneToMany(() => ReelShare, (share) => share.reel)
  shares!: ReelShare[];

  @OneToMany(() => ReelReport, (report) => report.reel)
  reports!: ReelReport[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
