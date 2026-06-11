import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphqlContext } from '../common/graphql-context';

export const ProjectId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | undefined => {
    const gqlContext = GqlExecutionContext.create(context);
    return gqlContext.getContext<GraphqlContext>().req.projectId;
  },
);
