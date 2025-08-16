// File: services/businesses-service/backend/src/common/decorators/action.decorator.ts
import { SetMetadata } from '@nestjs/common';

export type BusinessAction =
  | 'list' | 'read'
  | 'create' | 'update'
  | 'delete' | 'restore'
  | 'approve' | 'reject' | 'suspend'
  | 'manageManagers';

export const ACTION_KEY = 'business_action';
export const Action = (action: BusinessAction) => SetMetadata(ACTION_KEY, action);
