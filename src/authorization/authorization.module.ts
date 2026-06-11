import { Module } from '@nestjs/common';
import { AccessTokenModule } from '../core/access-token/access-token.module';
import { AuthorizationResolver } from './authorization.resolver';
import { AuthorizationService } from './authorization.service';

@Module({
  imports: [AccessTokenModule],
  providers: [AuthorizationService, AuthorizationResolver],
  exports: [AuthorizationService],
})
export class AuthorizationModule {}
