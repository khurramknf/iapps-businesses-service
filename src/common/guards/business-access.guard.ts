// File: services/businesses-service/backend/src/common/guards/business-access.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ACTION_KEY, BusinessAction } from '../decorators/action.decorator';
import { Role } from '../enums/role.enum';
import { BusinessesService } from '../../businesses/businesses.service';
import { OrganizationsClient } from '../services/organizations.client';

@Injectable()
export class BusinessAccessGuard implements CanActivate {
  private readonly logger = new Logger(BusinessAccessGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly businesses: BusinessesService,
    private readonly orgs: OrganizationsClient,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const action = this.reflector.get<BusinessAction | undefined>(
      ACTION_KEY,
      context.getHandler(),
    );
    const req = context.switchToHttp().getRequest();

    const user = req.user as { id: string | number; role?: string } | undefined;
    if (!user || user.id == null) throw new ForbiddenException('Forbidden');

    // Normalize actor id to number
    const actorIdNum = Number(user.id);
    if (!Number.isFinite(actorIdNum)) throw new ForbiddenException('Forbidden');

    // Admin/Staff: allow
    if (user.role === Role.Admin || user.role === Role.Staff) return true;

    // Allow listing; service will scope results by RBAC
    if (action === 'list') return true;

    const businessId = req.params?.id as string | undefined;

    // organizationId is numeric in your schema
    const orgIdFromBody = req.body?.organizationId as number | undefined;
    let orgIdNum: number | undefined = orgIdFromBody;

    // If not in body, fetch via business
    if (!orgIdNum && businessId) {
      const b = await this.businesses.findOne(businessId);
      orgIdNum = b.organizationId; // number
      (req as any).__business = b;
    }

    if (!Number.isFinite(orgIdNum)) {
      if (action === 'create') throw new ForbiddenException('organizationId required');
      throw new ForbiddenException('Forbidden');
    }

    // Owner check (numbers)
    try {
      const isOwner = await this.orgs.isOwner(actorIdNum, orgIdNum!);
      if (isOwner) return true;
    } catch (e) {
      this.logger.warn(`isOwner check failed: ${(e as any)?.message ?? e}`);
    }

    // Business‑specific manager
    if (businessId) {
      try {
        const isSpecificMgr = await this.businesses.isSpecificManager(businessId, actorIdNum);
        if (isSpecificMgr) {
          if (this.managerAllows(action)) return true;
          throw new ForbiddenException('Insufficient manager privileges');
        }
      } catch (e) {
        this.logger.warn(`isSpecificManager check failed: ${(e as any)?.message ?? e}`);
      }
    }

    // Org‑level manager
    try {
      const isOrgMgr = await this.orgs.isOrgManager(actorIdNum, orgIdNum!);
      if (isOrgMgr) {
        if (this.managerAllows(action)) return true;
        throw new ForbiddenException('Insufficient manager privileges');
      }
    } catch (e) {
      this.logger.warn(`isOrgManager check failed: ${(e as any)?.message ?? e}`);
    }

    throw new ForbiddenException('Forbidden');
  }


  private managerAllows(action?: BusinessAction): boolean {
    return !!action && (action === 'list' || action === 'read' || action === 'update' || action === 'manageManagers');
  }
}
