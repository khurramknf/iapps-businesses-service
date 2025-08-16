// File: services/businesses-service/backend/src/businesses/dto/query-business.dto.ts
import { IsBoolean, IsBooleanString, IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { BusinessStatus } from '../../common/enums/business-status.enum';
import { Transform } from 'class-transformer';

export class QueryBusinessDto {
  @IsOptional() @IsInt()
  organizationId?: number;

  @IsOptional() @IsInt()
  managerUserId?: number;

  @IsOptional() @IsString()
  status?: BusinessStatus | `${BusinessStatus}` | string;

  @IsOptional() @IsBooleanString()
  isActive?: string;

  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsInt() @Min(1)
  page?: number;

  @IsOptional() @IsInt() @Min(1)
  limit?: number;

  @IsOptional() @IsString()
  sort?: 'createdAt' | 'updatedAt' | 'name' | 'status' | 'isActive';

  @IsOptional() @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  @IsBoolean()
  includeDeleted?: boolean;
}
