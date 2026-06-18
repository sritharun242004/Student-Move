import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MerchantProfile } from './merchant-profile.entity';
import { Voucher } from './voucher.entity';

export enum RedemptionStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Entity({ name: 'redemption_records' })
export class RedemptionRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  voucherId!: string;

  @ManyToOne(() => Voucher, (voucher) => voucher.redemptions, {
    onDelete: 'CASCADE',
  })
  voucher!: Voucher;

  @Column({ type: 'uuid' })
  merchantId!: string;

  @ManyToOne(() => MerchantProfile, { onDelete: 'CASCADE' })
  merchant!: MerchantProfile;

  @CreateDateColumn({ type: 'timestamptz' })
  scannedAt!: Date;

  @Column({ type: 'enum', enum: RedemptionStatus })
  status!: RedemptionStatus;

  @Column({ type: 'varchar', length: 400, nullable: true })
  reason?: string;
}
