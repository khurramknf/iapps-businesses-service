// File: services/businesses-service/backend/src/auth/jwt-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private publicKey?: string;

  constructor() {
    const key = process.env.AUTH_JWT_PUBLIC_KEY;
    const keyPath = process.env.AUTH_JWT_PUBLIC_KEY_PATH;
    if (key) this.publicKey = key.replace(/\\n/g, '\n');
    else if (keyPath && fs.existsSync(keyPath)) this.publicKey = fs.readFileSync(keyPath, 'utf8');
  }

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const auth = req.headers['authorization'] as string | undefined;
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Missing bearer token');

    const token = auth.slice(7);
    try {
      const alg = (process.env.AUTH_JWT_ALG || 'RS256') as jwt.Algorithm;
      const payload = this.publicKey
        ? (jwt.verify(token, this.publicKey, { algorithms: [alg] }) as any)
        : (jwt.decode(token) as any); // fallback (not recommended for prod)

      if (!payload || !payload.sub) throw new Error('Invalid token');

      req.user = {
        id: String(payload.sub ?? payload.id),
        email: payload.email,
        role: payload.role,
        orgIds: payload.orgIds,
        exp: payload.exp,
      };
      return true;
    } catch (e: any) {
      this.logger.warn(`JWT verify failed: ${e?.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
