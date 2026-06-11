import { Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Args } from '@nestjs/graphql';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import {
  LoginInput,
  RefreshTokenInput,
  RegisterAdminInput,
} from './dto/auth.inputs';
import { AuthPayload, AuthUser } from './models/auth.models';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from '../common/graphql-context';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  registerAdmin(@Args('input') input: RegisterAdminInput) {
    return this.authService.registerAdmin(input);
  }

  @Mutation(() => AuthPayload)
  login(@Args('input') input: LoginInput) {
    return this.authService.login(input);
  }

  @Mutation(() => AuthPayload)
  refreshToken(@Args('input') input: RefreshTokenInput) {
    return this.authService.refresh(input);
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
}
