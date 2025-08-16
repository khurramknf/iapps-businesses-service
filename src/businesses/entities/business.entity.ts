// File: services/businesses-service/backend/src/businesses/entities/business.entity.ts
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BusinessStatus } from '../../common/enums/business-status.enum';
import { Category } from '../../categories/entities/category.entity'; // TODO: stub for now or adjust when categories module lands

@Entity('businesses')
@Index('ux_businesses_slug_global', ['slug'], { unique: true }) // global uniqueness
export class Business {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_businesses_org')
  @Column({ type: 'int' })
  organizationId!: number;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  // Manual, globally unique (validated in service + DB unique index)
  @Column({ type: 'varchar', length: 140 })
  slug!: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  description: string | null;

  // Admin-defined tags only (validated in service in next phase).
  @Column({ type: 'jsonb', default: () => `'[]'` })
  tags!: string[];

  // Variable-depth taxonomy. We’ll map once categories module lands.
  @ManyToMany(() => Category, { eager: false })
  @JoinTable({
    name: 'business_categories',
    joinColumn: { name: 'businessId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'categoryId', referencedColumnName: 'id' },
  })
  categories?: Category[];

  // Moderation status (approval workflow)
  @Index('idx_businesses_status')
  @Column({
    type: 'varchar',
    length: 32,
    default: BusinessStatus.PENDING,
  })
  status!: BusinessStatus;

  // Visibility toggle (separate from status)
  @Index('idx_businesses_active')
  @Column({ type: 'boolean', default: false })
  isActive!: boolean;

  // SEO/meta (simple now, scalable later)
  @Column({
    type: 'jsonb',
    default: () => `'{}'`,
  })
  seo!: {
    metaTitle?: string | null;
    metaDescription?: string | null;
    canonicalUrl?: string | null;
    robots?: string | null; // "index,follow" | "noindex,nofollow" | ...
    ogTitle?: string | null;
    ogDescription?: string | null;
    ogImageUrl?: string | null;
    jsonLd?: Record<string, unknown> | null;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Index('idx_businesses_deleted')
  @DeleteDateColumn()
  deletedAt: Date | null;
}
