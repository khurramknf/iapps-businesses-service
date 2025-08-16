// File: services/businesses-service/backend/src/businesses/dto/assign-manager.dto.ts
import { IsOptional, IsIn, IsInt } from 'class-validator';

export class AssignManagerDto {
  @IsInt()
  userId!: number;

  @IsOptional()
  @IsIn(['manager'])
  role?: 'manager' = 'manager';
}
