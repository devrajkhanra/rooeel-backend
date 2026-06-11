import { SetMetadata } from '@nestjs/common';
import { PermissionTokenValue } from './permission-tokens';

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';

export const RequirePermissions = (...permissions: PermissionTokenValue[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
