import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthenticatedUser, GraphqlContext } from '../common/graphql-context';

export const CurrentUser = createParamDecorator(
  (
    _data: unknown,
    context: ExecutionContext,
  ): AuthenticatedUser | undefined => {
    const gqlContext = GqlExecutionContext.create(context);
    return gqlContext.getContext<GraphqlContext>().req.user;
  },
);
