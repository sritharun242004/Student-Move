import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { StudentProfile } from './student-profile.entity';

@Entity({ name: 'student_follows' })
@Unique(['followerId', 'followingId'])
export class StudentFollow {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  followerId!: string;

  @ManyToOne(() => StudentProfile, (profile) => profile.following, { onDelete: 'CASCADE' })
  follower!: StudentProfile;

  @Column({ type: 'uuid' })
  followingId!: string;

  @ManyToOne(() => StudentProfile, (profile) => profile.followers, { onDelete: 'CASCADE' })
  following!: StudentProfile;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
