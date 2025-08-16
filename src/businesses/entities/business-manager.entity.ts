// File: services/businesses-service/backend/src/businesses/entities/business-manager.entity.ts
import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Unique,
  Index,
} from 'typeorm';

@Entity('business_managers')
@Unique('ux_business_managers_business_user', ['businessId', 'userId'])
export class BusinessManager {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_mgr_business')
  @Column({ type: 'uuid' })
  businessId!: string;

  @Index('idx_mgr_user')
  @Column({ type: 'int' })
  userId!: number;

  @Column({ type: 'int' })
  assignedByUserId!: number;

  @Column({ type: 'varchar', length: 32, default: 'manager' })
  role!: 'manager';

  @CreateDateColumn()
  createdAt!: Date;
}
