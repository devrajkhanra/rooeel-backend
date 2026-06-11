import { Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuthorizationService } from './authorization.service';
import { PermissionModel } from './models/permission.model';

@Resolver(() => PermissionModel)
export class AuthorizationResolver {
  constructor(private readonly authorizationService: AuthorizationService) {}

  @Query(() => [PermissionModel])
  @UseGuards(AuthGuard)
  permissions() {
    return this.authorizationService.listPermissions();
  }
}
