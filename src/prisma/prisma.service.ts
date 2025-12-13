import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class PrismaService implements OnModuleInit {
  private prisma: any;

  constructor() {
    const { PrismaClient } = require('../../node_modules/.prisma/client/client');
    this.prisma = new PrismaClient();
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.prisma.$on('beforeExit', async () => {
      await app.close();
    });
  }

  get client() {
    return this.prisma;
  }
}