import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Listing } from './listing.entity';
import { Message } from './message.entity';

@Entity({ name: 'marketplace_conversations' })
@Unique(['listingId', 'buyerStudentId'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  listingId!: string;

  @ManyToOne(() => Listing, { onDelete: 'CASCADE' })
  listing!: Listing;

  @Column({ type: 'integer' })
  buyerStudentId!: number;

  @Column({ type: 'integer' })
  sellerStudentId!: number;

  @OneToMany(() => Message, (message) => message.conversation, { cascade: true })
  messages!: Message[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
