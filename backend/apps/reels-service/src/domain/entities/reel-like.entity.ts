import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Reel } from './reel.entity';
import { StudentProfile } from './student-profile.entity';

@Entity({ name: 'reel_likes' })
@Unique(['reelId', 'studentId'])
export class ReelLike {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  reelId!: string;

  @ManyToOne(() => Reel, (reel) => reel.likes, { onDelete: 'CASCADE' })
  reel!: Reel;

  @Column({ type: 'uuid' })
  studentId!: string;

  @ManyToOne(() => StudentProfile, (profile) => profile.likes, { onDelete: 'CASCADE' })
  student!: StudentProfile;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
