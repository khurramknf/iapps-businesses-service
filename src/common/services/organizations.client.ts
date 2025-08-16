import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrganizationsClient {
  private readonly logger = new Logger(OrganizationsClient.name);
  // ✅ use the same env var you have in .env (ORGANIZATIONS_SERVICE_URL)
  private readonly baseUrl = process.env.ORGANIZATIONS_SERVICE_URL || 'http://localhost:3500';
  private readonly timeout = Number(process.env.ORGS_TIMEOUT_MS || 2000);

  constructor(private readonly http: HttpService) {}

  async isOwner(userId: number, organizationId: number): Promise<boolean> {
    // quick sanity: both must be finite numbers
    if (!Number.isFinite(userId) || !Number.isFinite(organizationId)) return false;
    try {
      const url = `${this.baseUrl}/organizations/${organizationId}/owner/${userId}`;
      const { data } = await firstValueFrom(this.http.get(url, { timeout: this.timeout }));
      return !!data?.isOwner;
    } catch (e: any) {
      this.logger.warn(`isOwner fallback false: ${e?.message ?? e}`);
      return false;
    }
  }

  async isOrgManager(userId: number, organizationId: number): Promise<boolean> {
    if (!Number.isFinite(userId) || !Number.isFinite(organizationId)) return false;
    try {
      const url = `${this.baseUrl}/organizations/${organizationId}/managers/${userId}`;
      const { data } = await firstValueFrom(this.http.get(url, { timeout: this.timeout }));
      return !!data?.isManager;
    } catch (e: any) {
      this.logger.warn(`isOrgManager fallback false: ${e?.message ?? e}`);
      return false;
    }
  }

  // ✅ list org ids where user is owner or manager (to scope business listing)
  async listOrgIdsForUser(userId: string | number): Promise<number[]> {
    try {
      const uid = Number(userId);
      const url = `${this.baseUrl}/organizations/mine/ids?userId=${uid}&roles=owner,manager`;
      const { data } = await firstValueFrom(
        this.http.get(url, { timeout: this.timeout }),
      );
      return Array.isArray(data?.organizationIds)
        ? data.organizationIds.map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n))
        : [];
    } catch (e: any) {
      this.logger.warn(`listOrgIdsForUser fallback []: ${e?.message}`);
      return [];
    }
  }
}
