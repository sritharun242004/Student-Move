import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Reel } from './reel.entity';
import { ReelComment } from './reel-comment.entity';
import { ReelLike } from './reel-like.entity';
import { ReelReport } from './reel-report.entity';
import { ReelShare } from './reel-share.entity';
import { StudentFollow } from './student-follow.entity';

export enum StudentProfileStatus {
  ACTIVE = 'ACTIVE',
  BANNED = 'BANNED',
}

@Entity({ name: 'student_profiles' })
export class StudentProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'numeric', unique: true })
  userId!: string;

  @Column({ type: 'varchar', length: 200 })
  displayName!: string;

  @Column({ type: 'text', nullable: true })
  profilePhotoUrl?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'integer', default: 0 })
  followersCount!: number;

  @Column({ type: 'integer', default: 0 })
  followingCount!: number;

  @Column({ type: 'enum', enum: StudentProfileStatus, default: StudentProfileStatus.ACTIVE })
  status!: StudentProfileStatus;

  @OneToMany(() => Reel, (reel) => reel.creator)
  reels!: Reel[];

  @OneToMany(() => ReelLike, (like) => like.student)
  likes!: ReelLike[];

  @OneToMany(() => ReelComment, (comment) => comment.student)
  comments!: ReelComment[];

  @OneToMany(() => ReelShare, (share) => share.student)
  shares!: ReelShare[];

  @OneToMany(() => ReelReport, (report) => report.student)
  reports!: ReelReport[];

  @OneToMany(() => StudentFollow, (follow) => follow.follower)
  following!: StudentFollow[];

  @OneToMany(() => StudentFollow, (follow) => follow.following)
  followers!: StudentFollow[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
