import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Reel } from './reel.entity';
import { StudentProfile } from './student-profile.entity';

@Entity({ name: 'reel_comments' })
export class ReelComment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  reelId!: string;

  @ManyToOne(() => Reel, (reel) => reel.comments, { onDelete: 'CASCADE' })
  reel!: Reel;

  @Column({ type: 'uuid' })
  studentId!: string;

  @ManyToOne(() => StudentProfile, (profile) => profile.comments, { onDelete: 'CASCADE' })
  student!: StudentProfile;

  @Column({ type: 'text' })
  comment!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
