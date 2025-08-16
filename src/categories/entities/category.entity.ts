// File: services/businesses-service/backend/src/categories/entities/category.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('categories')
@Index('ux_categories_slug_global', ['slug'], { unique: true })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 140 })
  slug!: string; // global unique, manual or admin-managed

  @Column({ type: 'uuid', nullable: true })
  parentId: string | null;

  // optional materialized path for fast reads, fill later
  @Column({ type: 'varchar', length: 1024, nullable: true })
  path: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
