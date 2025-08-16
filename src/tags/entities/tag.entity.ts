// File: services/businesses-service/backend/src/tags/entities/tag.entity.ts
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tags')
@Index('ux_tags_name', ['name'], { unique: true })
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 40 })
  name!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
