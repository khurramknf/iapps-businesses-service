// File: services/businesses-service/backend/src/auth/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUser {
  id: string;
  email?: string;
  role?: string;
  orgIds?: string[];      // optional hint from JWT
  exp?: number;
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): CurrentUser | null => {
    const req = ctx.switchToHttp().getRequest();
    return req.user ?? null;
  },
);
