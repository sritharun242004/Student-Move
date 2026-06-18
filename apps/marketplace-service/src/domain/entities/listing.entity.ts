import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { ListingPhoto } from './listing-photo.entity';

export enum ListingType {
  SINGLE = 'SINGLE',
  STOCK = 'STOCK',
}

export enum ListingStatus {
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  REMOVED = 'REMOVED',
}

@Entity({ name: 'marketplace_listings' })
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'integer' })
  studentId!: number;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'varchar', length: 200 })
  location!: string;

  @Column({ type: 'integer' })
  categoryId!: number;

  @ManyToOne(() => Category, (category) => category.listings, { onDelete: 'RESTRICT' })
  category!: Category;

  @Column({ type: 'enum', enum: ListingType })
  listingType!: ListingType;

  @Column({ type: 'integer', nullable: true })
  totalStock?: number;

  @Column({ type: 'integer', default: 0 })
  soldItems!: number;

  @Column({ type: 'varchar', length: 50 })
  contactNumber!: string;

  @Column({ type: 'enum', enum: ListingStatus, default: ListingStatus.ACTIVE })
  status!: ListingStatus;

  @OneToMany(() => ListingPhoto, (photo) => photo.listing, { cascade: true })
  photos!: ListingPhoto[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
