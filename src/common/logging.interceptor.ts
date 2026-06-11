import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = Date.now();
    const requestType = context.getType<'http' | 'graphql'>();

    const label =
      requestType === 'graphql'
        ? this.graphqlLabel(context)
        : this.httpLabel(context);

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(`${label} completed in ${Date.now() - startedAt}ms`);
        },
        error: (error: unknown) => {
          const message =
            error instanceof Error ? error.message : 'Unknown execution error';
          this.logger.error(
            `${label} failed in ${Date.now() - startedAt}ms: ${message}`,
          );
        },
      }),
    );
  }

  private graphqlLabel(context: ExecutionContext) {
    const gqlContext = GqlExecutionContext.create(context);
    const info = gqlContext.getInfo();
    return `graphql ${info.parentType.name}.${info.fieldName}`;
  }

  private httpLabel(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      method?: string;
      originalUrl?: string;
    }>();

    return `http ${request.method ?? 'GET'} ${request.originalUrl ?? '/'}`;
  }
}
