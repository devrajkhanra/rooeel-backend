import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphqlContext } from '../common/graphql-context';
import { AuthorizationService } from './authorization.service';
import { REQUIRED_PERMISSIONS_KEY } from './permissions.decorator';
import { PermissionTokenValue } from './permission-tokens';

@Injectable()
export class ProjectPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<PermissionTokenValue[]>(
        REQUIRED_PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    const gqlContext = GqlExecutionContext.create(context);
    const request = gqlContext.getContext<GraphqlContext>().req;
    const user = request.user;
    const requestedProjectId = this.getProjectId(request.headers['x-project-id']);

    if (!user) {
      throw new ForbiddenException('Authenticated user is required.');
    }

    const projectId = await this.authorizationService.resolveAccessibleProjectId(
      user.sub,
      requiredPermissions,
      requestedProjectId,
    );

    if (!projectId) {
      throw new ForbiddenException('Missing required project permission.');
    }

    request.projectId = projectId;
    return true;
  }

  private getProjectId(header: string | string[] | undefined) {
    return Array.isArray(header) ? header[0] : header;
  }
}
