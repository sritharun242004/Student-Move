import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Listing } from './listing.entity';

@Entity({ name: 'marketplace_listing_photos' })
export class ListingPhoto {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  listingId!: string;

  @ManyToOne(() => Listing, (listing) => listing.photos, { onDelete: 'CASCADE' })
  listing!: Listing;

  @Column({ type: 'text' })
  photoUrl!: string;

  @Column({ type: 'integer', default: 0 })
  displayOrder!: number;
}
