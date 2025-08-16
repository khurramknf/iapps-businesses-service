import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard'; // ← your exact guard

// Test guard: always allows and injects an admin user
class AllowAllJwtGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    req.user = { id: '1', role: 'admin', email: 'admin@iapps.com' };
    return true;
  }
}

// Safely override a provider token if it exists in the module graph
function safeOverrideProvider(builder: TestingModuleBuilder, token: any, useValue: any) {
  try {
    // @ts-ignore - runtime API present on TestingModuleBuilder
    builder.overrideProvider(token).useValue(useValue);
  } catch {
    // If the guard wasn't registered as a provider, try overrideGuard (Nest >=9)
    try {
      // @ts-ignore - available in newer Nest versions
      builder.overrideGuard(token).useValue(useValue);
    } catch {
      // As a last resort, we could app.useGlobalGuards in createApp (not needed here)
    }
  }
}

export async function createApp(): Promise<INestApplication> {
  const builder = Test.createTestingModule({ imports: [AppModule] });

  // Override the EXACT guard class your controller uses
  safeOverrideProvider(builder, JwtAuthGuard, new AllowAllJwtGuard());

  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication();

  await app.init();
  return app;
}
