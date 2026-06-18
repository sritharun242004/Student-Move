import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Offer } from './offer.entity';
import { RedemptionRecord } from './redemption-record.entity';

export enum VoucherStatus {
  PENDING = 'PENDING',
  REDEEMED = 'REDEEMED',
}

@Entity({ name: 'vouchers' })
export class Voucher {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  offerId!: string;

  @ManyToOne(() => Offer, (offer) => offer.vouchers, {
    onDelete: 'CASCADE',
  })
  offer!: Offer;

  @Column({ type: 'numeric' })
  studentId!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  uniqueCode!: string;

  @Column({ type: 'timestamptz' })
  validUntil!: Date;

  @Column({ type: 'enum', enum: VoucherStatus, default: VoucherStatus.PENDING })
  status!: VoucherStatus;

  @OneToMany(() => RedemptionRecord, (record) => record.voucher)
  redemptions!: RedemptionRecord[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
