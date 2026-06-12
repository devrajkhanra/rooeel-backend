import { Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Args, Context } from '@nestjs/graphql';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import {
  LoginInput,
  RefreshTokenInput,
  RegisterAdminInput,
} from './dto/auth.inputs';
import { AuthPayload, AuthUser } from './models/auth.models';
import { AuthService } from './auth.service';
import type {
  AuthenticatedUser,
  GraphqlContext,
} from '../common/graphql-context';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  registerAdmin(
    @Args('input') input: RegisterAdminInput,
    @Context() context: GraphqlContext,
  ) {
    return this.authService.registerAdmin(
      input,
      this.clientKeyFromContext(context),
    );
  }

  @Mutation(() => AuthPayload)
  login(@Args('input') input: LoginInput, @Context() context: GraphqlContext) {
    return this.authService.login(input, this.clientKeyFromContext(context));
  }

  @Mutation(() => AuthPayload)
  refreshToken(
    @Args('input') input: RefreshTokenInput,
    @Context() context: GraphqlContext,
  ) {
    return this.authService.refresh(input, this.clientKeyFromContext(context));
  }

  @Mutation(() => Boolean)
  logout(@Args('input') input: RefreshTokenInput) {
    return this.authService.logout(input);
  }

  @Query(() => AuthUser)
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getUser(user.sub);
  }

  private clientKeyFromContext(context: GraphqlContext) {
    const forwardedFor = context.req.headers['x-forwarded-for'];
    const forwardedAddress = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor;
    const firstForwardedAddress = forwardedAddress?.split(',')[0]?.trim();

    return (
      firstForwardedAddress ||
      context.req.ip ||
      context.req.socket.remoteAddress ||
      'unknown'
    );
  }
}
