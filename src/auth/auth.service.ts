import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { hash, verify } from 'argon2';
import { PrismaService } from '../core/prisma/prisma.service';
import { RedisService } from '../core/redis/redis.service';
import {
  LoginInput,
  RefreshTokenInput,
  RegisterAdminInput,
} from './dto/auth.inputs';

@Injectable()
export class AuthService {
  private readonly accessTokenTtlSeconds = 15 * 60;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async registerAdmin(input: RegisterAdminInput) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new BadRequestException('A user with this email already exists.');
    }

    const passwordHash = await hash(input.password);

    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        passwordHash,
      },
    });

    return this.issueTokens(user.id);
  }

  async login(input: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const passwordIsValid = await verify(user.passwordHash, input.password);
    if (!passwordIsValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.issueTokens(user.id);
  }

  async refresh(input: RefreshTokenInput) {
    const tokenHash = this.hashToken(input.refreshToken);
    const session = await this.prisma.refreshSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !session ||
      session.status !== 'ACTIVE' ||
      session.expiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    await this.revokeRefreshSession(session.id);
    return this.issueTokens(session.userId);
  }

  async logout(input: RefreshTokenInput) {
    const tokenHash = this.hashToken(input.refreshToken);
    const session = await this.prisma.refreshSession.findUnique({
      where: { tokenHash },
    });

    if (session) {
      await this.revokeRefreshSession(session.id);
    }

    return true;
  }

  async getUser(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      createdAt: user.createdAt,
    };
  }

  private async issueTokens(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const refreshToken = randomBytes(48).toString('base64url');
    const refreshTokenHash = this.hashToken(refreshToken);
    const refreshTtlDays = Number(
      this.configService.get<string>('JWT_REFRESH_TTL_DAYS') ?? '30',
    );
    const expiresAt = new Date(
      Date.now() + refreshTtlDays * 24 * 60 * 60 * 1000,
    );

    const session = await this.prisma.refreshSession.create({
      data: {
        userId,
        tokenHash: refreshTokenHash,
        expiresAt,
      },
    });

    await this.redisService.setJson(
      `refresh-session:${session.id}`,
      { userId, status: 'ACTIVE' },
      refreshTtlDays * 24 * 60 * 60,
    );

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      refreshToken,
      expiresInSeconds: this.accessTokenTtlSeconds,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        createdAt: user.createdAt,
      },
    };
  }

  private async revokeRefreshSession(sessionId: string) {
    await this.prisma.refreshSession.update({
      where: { id: sessionId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        lastRotatedAt: new Date(),
      },
    });
    await this.redisService.delete(`refresh-session:${sessionId}`);
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

}
