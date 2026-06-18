import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Reel } from './reel.entity';
import { StudentProfile } from './student-profile.entity';

export enum ReelReportStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
}

@Entity({ name: 'reel_reports' })
export class ReelReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  reelId!: string;

  @ManyToOne(() => Reel, (reel) => reel.reports, { onDelete: 'CASCADE' })
  reel!: Reel;

  @Column({ type: 'uuid' })
  studentId!: string;

  @ManyToOne(() => StudentProfile, (profile) => profile.reports, { onDelete: 'CASCADE' })
  student!: StudentProfile;

  @Column({ type: 'varchar', length: 200 })
  reason!: string;

  @Column({ type: 'text', nullable: true })
  details?: string;

  @Column({ type: 'enum', enum: ReelReportStatus, default: ReelReportStatus.PENDING })
  status!: ReelReportStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
