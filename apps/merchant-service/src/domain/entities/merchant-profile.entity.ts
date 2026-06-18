import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Offer } from './offer.entity';

@Entity({ name: 'merchant_profiles' })
export class MerchantProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'numeric', unique: true })
  userId!: string;

  @Column({ type: 'varchar', length: 200 })
  businessName!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 320 })
  businessEmail!: string;

  @Column({ type: 'varchar', length: 30 })
  phone!: string;

  @Column({ type: 'text' })
  address!: string;

  @Column({ type: 'text', nullable: true })
  profileImageUrl?: string;

  @Column({ type: 'boolean', default: false })
  isApproved!: boolean;

  @Column({ type: 'boolean', default: false })
  isSuspended!: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true, select: false })
  secretCodeHash?: string | null;

  @OneToMany(() => Offer, (offer) => offer.merchant)
  offers!: Offer[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
