import { Column, Entity, OneToMany, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import type { Listing } from './listing.entity';

@Entity({ name: 'marketplace_categories' })
export class Category {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'integer', nullable: true })
  parentId?: number;

  @ManyToOne(() => Category, (category) => category.subcategories, { nullable: true, onDelete: 'SET NULL' })
  parent?: Category;

  @OneToMany(() => Category, (category) => category.parent)
  subcategories!: Category[];

  @OneToMany('Listing', (listing: Listing) => listing.category)
  listings!: Listing[];
}
