import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MerchantProfile } from './merchant-profile.entity';
import { Voucher } from './voucher.entity';

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

@Entity({ name: 'offers' })
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  merchantId!: string;

  @ManyToOne(() => MerchantProfile, (merchant) => merchant.offers, {
    onDelete: 'CASCADE',
  })
  merchant!: MerchantProfile;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text', nullable: true })
  imageUrl?: string;

  @Column({ type: 'enum', enum: DiscountType })
  discountType!: DiscountType;

  @Column({ type: 'float8', nullable: true })
  amount?: number;

  @Column({ type: 'integer', nullable: true })
  usageLimit?: number;

  @Column({ type: 'integer', default: 0 })
  usedCount!: number;

  @Column({ type: 'integer' })
  perStudentLimit!: number;

  @Column({ type: 'timestamptz' })
  expiryDate!: Date;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => Voucher, (voucher) => voucher.offer)
  vouchers!: Voucher[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
