// File: services/businesses-service/backend/src/businesses/businesses.service.ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, ILike, In, Repository } from 'typeorm';
import { Business } from './entities/business.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { QueryBusinessDto } from './dto/query-business.dto';
import { BusinessManager } from './entities/business-manager.entity';
import { AssignManagerDto } from './dto/assign-manager.dto';
import { BusinessStatus } from '../common/enums/business-status.enum';
import { TagsService } from '../tags/tags.service';
import { CategoriesService } from '../categories/categories.service';
import { OrganizationsClient } from 'src/common/services/organizations.client';

@Injectable()
export class BusinessesService {
  private readonly logger = new Logger(BusinessesService.name);

  constructor(
    @InjectRepository(Business) private readonly repo: Repository<Business>,
    @InjectRepository(BusinessManager) private readonly mgrRepo: Repository<BusinessManager>,
    @InjectDataSource() private readonly ds: DataSource,
    private readonly tagsSvc: TagsService,
    private readonly categoriesSvc: CategoriesService,
    private readonly orgs: OrganizationsClient,   
  ) {}

  // --- Helpers --------------------------------------------------------------

  private async ensureSlugAvailable(slug: string, ignoreId?: string) {
    const existing = await this.repo.findOne({
      where: ignoreId
        ? ({ slug, id: In([ignoreId]) } as any) // will filter below
        : ({ slug } as FindOptionsWhere<Business>),
      withDeleted: true,
    });

    if (existing && existing.id !== ignoreId) {
      throw new ConflictException('Slug is already taken');
    }
  }

  private normalizeSlug(slug: string) {
    return slug.trim().toLowerCase();
  }

  // --- CRUD ----------------------------------------------------------------

  async list(
    q: QueryBusinessDto & { includeDeleted?: boolean },
    requester?: { id?: string | number; role?: string },
  ) {
    const page  = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(q.limit ?? 20)));
    const search = (q.search ?? '').trim();
    const includeDeleted = !!q.includeDeleted;

    const role = requester?.role ?? 'user';
    const uid  = requester?.id != null ? Number(requester.id) : null;
    const isElevated = role === 'admin' || role === 'staff';

    const qb = this.repo.createQueryBuilder('b');

    if (!includeDeleted) {
      qb.andWhere('b.deletedAt IS NULL');
    } else {
      qb.withDeleted();
    }

    if (search) {
      qb.andWhere('(b.name ILIKE :s OR b.slug ILIKE :s)', { s: `%${search}%` });
    }

    // ✅ SCOPING
    if (!isElevated) {
      // 1) orgs where user is owner/manager
      const orgIds = uid ? (await this.orgs.listOrgIdsForUser(uid)) : [];
      // 2) businesses where user is specific manager
      const mgrBizRows = uid
        ? await this.mgrRepo.find({ where: { userId: uid }, select: ['businessId'] })
        : [];
      const managedBizIds = mgrBizRows.map((r) => r.businessId);

      // If user has no memberships and no direct manager assignments → see nothing
      if (!orgIds.length && !managedBizIds.length) {
        return { items: [], meta: { page, limit, total: 0 } };
      }

      qb.andWhere(
        [
          orgIds.length ? 'b.organizationId IN (:...orgIds)' : null,
          managedBizIds.length ? 'b.id IN (:...bizIds)' : null,
        ].filter(Boolean).join(' OR '),
        { orgIds, bizIds: managedBizIds },
      );
    }

    qb.orderBy('b.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, meta: { page, limit, total } };
  }

  async isSpecificManager(businessId: string, userId: number): Promise<boolean> {
    const count = await this.mgrRepo.count({ where: { businessId, userId } });
    return count > 0;
  }

  async findOne(id: string) {
    const b = await this.repo.findOne({ where: { id } });
    if (!b) throw new NotFoundException('Business not found');
    return b;
  }

  async create(dto: CreateBusinessDto, actorId: string) {
    const slug = this.normalizeSlug(dto.slug);
    await this.ensureSlugAvailable(slug);

    try {
      await this.tagsSvc.ensureAllExist(dto.tags);
      await this.categoriesSvc.ensureExist(dto.categoryIds);
    } catch (e: any) {
      throw new BadRequestException(e?.message ?? 'Invalid tags or categories');
    }

    // VALIDATIONS added in Phase 2:
    await this.tagsSvc.ensureAllExist(dto.tags);
    await this.categoriesSvc.ensureExist(dto.categoryIds);

    const entity = this.repo.create({
      organizationId: dto.organizationId,
      name: dto.name.trim(),
      slug,
      description: dto.description?.trim() ?? null,
      tags: dto.tags ?? [],
      // categories mapped later (when we load relations)
      status: BusinessStatus.PENDING,
      isActive: false,
      seo: (dto.seo as any) ?? {},
    });

    const saved = await this.repo.save(entity);
    this.logger.log(`Business created id=${saved.id} org=${saved.organizationId} by=${actorId}`);
    return saved;
  }

  async update(id: string, dto: UpdateBusinessDto, actorId: string) {
    const b = await this.repo.findOne({ where: { id }, withDeleted: true });
    if (!b) throw new NotFoundException('Business not found');

    if (dto.slug) {
      const slug = this.normalizeSlug(dto.slug);
      if (slug !== b.slug) await this.ensureSlugAvailable(slug, b.id);
      b.slug = slug;
    }

    try {
      if (dto.tags) await this.tagsSvc.ensureAllExist(dto.tags);
      if (dto.categoryIds) await this.categoriesSvc.ensureExist(dto.categoryIds);
    } catch (e: any) {
      throw new BadRequestException(e?.message ?? 'Invalid tags or categories');
    }

    if (dto.tags) await this.tagsSvc.ensureAllExist(dto.tags);
    if (dto.categoryIds) await this.categoriesSvc.ensureExist(dto.categoryIds);

    if (dto.name) b.name = dto.name.trim();
    if (typeof dto.description !== 'undefined') b.description = dto.description?.trim() ?? null;
    if (dto.tags) b.tags = dto.tags;
    if (typeof dto.isActive !== 'undefined') b.isActive = dto.isActive;
    if (dto.seo) b.seo = dto.seo as any;

    const saved = await this.repo.save(b);
    this.logger.log(`Business updated id=${saved.id} by=${actorId}`);
    return saved;
  }

  async softDelete(id: string, actorId: string) {
    const b = await this.repo.findOne({ where: { id } });
    if (!b) throw new NotFoundException('Business not found');
    await this.repo.softDelete(id);
    this.logger.warn(`Business soft-deleted id=${id} by=${actorId}`);
    return { success: true };
  }

  async restore(id: string, actorId: string) {
    const b = await this.repo.findOne({ where: { id }, withDeleted: true });
    if (!b) throw new NotFoundException('Business not found');
    if (!b.deletedAt) return { success: true };
    await this.repo.restore(id);
    this.logger.warn(`Business restored id=${id} by=${actorId}`);
    return await this.findOne(id);
  }

  // --- Approvals -----------------------------------------------------------

  async approve(id: string, actorId: string) {
    const b = await this.repo.findOne({ where: { id } });
    if (!b) throw new NotFoundException('Business not found');
    b.status = BusinessStatus.APPROVED;
    const saved = await this.repo.save(b);
    this.logger.log(`Business approved id=${id} by=${actorId}`);
    return saved;
  }

  async reject(id: string, actorId: string) {
    const b = await this.repo.findOne({ where: { id } });
    if (!b) throw new NotFoundException('Business not found');
    b.status = BusinessStatus.REJECTED;
    b.isActive = false;
    const saved = await this.repo.save(b);
    this.logger.log(`Business rejected id=${id} by=${actorId}`);
    return saved;
  }

  async suspend(id: string, actorId: string) {
    const b = await this.repo.findOne({ where: { id } });
    if (!b) throw new NotFoundException('Business not found');
    b.status = BusinessStatus.SUSPENDED;
    b.isActive = false;
    const saved = await this.repo.save(b);
    this.logger.warn(`Business suspended id=${id} by=${actorId}`);
    return saved;
  }

  // --- Managers ------------------------------------------------------------

  async listManagers(businessId: string) {
    const items = await this.mgrRepo.find({ where: { businessId } });
    return { managers: items };
  }

  async addManager(businessId: string, dto: AssignManagerDto, actorId: string) {
  // businessId is UUID (string)
  const b = await this.repo.findOne({ where: { id: businessId } });
  if (!b) throw new NotFoundException('Business not found');

  // Normalize numeric ids
  const userId = Number(dto.userId);
  const actorUid = Number(actorId);

  if (!Number.isFinite(userId)) {
    throw new BadRequestException('userId must be a number');
  }
  if (!Number.isFinite(actorUid)) {
    throw new BadRequestException('actor user id is invalid');
  }

  // ✅ match entity types exactly: { businessId: string; userId: number }
  const exists = await this.mgrRepo.findOne({ where: { businessId, userId } });
  if (exists) throw new ConflictException('User is already a manager of this business');

  // ✅ payload matches entity columns
  const mgr = this.mgrRepo.create({
    businessId,
    userId,
    assignedByUserId: actorUid,
    role: 'manager',
  });

  const saved = await this.mgrRepo.save(mgr);
  this.logger.log(`Manager assigned user=${userId} business=${businessId} by=${actorUid}`);
  return saved;
}

async removeManager(businessId: string, userIdParam: string, actorId: string) {
  // Path param arrives as string → normalize to number
  const userId = Number(userIdParam);
  const actorUid = Number(actorId);

  if (!Number.isFinite(userId)) {
    throw new BadRequestException('userId must be a number');
  }

  const exists = await this.mgrRepo.findOne({ where: { businessId, userId } });
  if (!exists) throw new NotFoundException('Manager assignment not found');

  await this.mgrRepo.delete(exists.id);
  this.logger.warn(`Manager removed user=${userId} business=${businessId} by=${actorUid}`);
  return { success: true };
}
}
