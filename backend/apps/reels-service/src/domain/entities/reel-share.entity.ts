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

@Entity({ name: 'reel_shares' })
@Unique(['reelId', 'studentId'])
export class ReelShare {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  reelId!: string;

  @ManyToOne(() => Reel, (reel) => reel.shares, { onDelete: 'CASCADE' })
  reel!: Reel;

  @Column({ type: 'uuid' })
  studentId!: string;

  @ManyToOne(() => StudentProfile, (profile) => profile.shares, { onDelete: 'CASCADE' })
  student!: StudentProfile;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
