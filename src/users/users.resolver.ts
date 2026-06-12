import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../common/graphql-context';
import { RequirePermissions } from '../authorization/permissions.decorator';
import { PermissionToken } from '../authorization/permission-tokens';
import { ProjectPermissionGuard } from '../authorization/project-permission.guard';
import { CreateAdminUserInput, UpdateAdminUserInput } from './dto/user.inputs';
import { AdminUserModel } from './models/user.models';
import { UsersService } from './users.service';

/**
 * Admin user management is intentionally project-scoped through
 * ProjectPermissionGuard + UserManage so it reuses the existing
 * authorization model rather than introducing a separate global-admin
 * concept. A caller must have user:manage on at least one project
 * (Project Admin role grants this by default).
 */
@Resolver(() => AdminUserModel)
@UseGuards(AuthGuard, ProjectPermissionGuard)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => AdminUserModel)
  @RequirePermissions(PermissionToken.UserManage)
  createAdminUser(
    @Args('input') input: CreateAdminUserInput,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.createUser(input, user.sub);
  }

  @Query(() => [AdminUserModel])
  @RequirePermissions(PermissionToken.UserManage)
  adminUsers(
    @Args('take', { type: () => Number, nullable: true }) take?: number,
    @Args('cursor', { nullable: true }) cursor?: string,
  ) {
    return this.usersService.listUsers(take, cursor);
  }

  @Query(() => AdminUserModel)
  @RequirePermissions(PermissionToken.UserManage)
  adminUser(@Args('userId') userId: string) {
    return this.usersService.getUser(userId);
  }

  @Mutation(() => AdminUserModel)
  @RequirePermissions(PermissionToken.UserManage)
  updateAdminUser(
    @Args('input') input: UpdateAdminUserInput,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.updateUser(input, user.sub);
  }

  @Mutation(() => Boolean)
  @RequirePermissions(PermissionToken.UserManage)
  deleteAdminUser(
    @Args('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.deleteUser(userId, user.sub);
  }
}