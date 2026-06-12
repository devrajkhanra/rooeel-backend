import { AuthService } from './auth.service';

describe('AuthService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    refreshSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  } as any;

  const jwtService = {
    signAsync: jest.fn(),
  } as any;

  const configService = {
    get: jest.fn(),
  } as any;

  const redisService = {
    delete: jest.fn(),
    incrementWithExpiry: jest.fn(),
    setJson: jest.fn(),
  } as any;

  let service: AuthService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new AuthService(prisma, jwtService, configService, redisService);
  });

  it('throttles login before checking credentials', async () => {
    redisService.incrementWithExpiry.mockResolvedValueOnce(11);

    await expect(
      service.login(
        {
          email: 'admin@example.com',
          password: 'super-secret-password',
        },
        '127.0.0.1',
      ),
    ).rejects.toMatchObject({
      status: 429,
    });

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
