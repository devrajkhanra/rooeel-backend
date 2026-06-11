import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly client: Client;
  private readonly bucketName: string;

  constructor(configService: ConfigService) {
    this.bucketName = configService.getOrThrow<string>('MINIO_BUCKET');
    this.client = new Client({
      endPoint: configService.getOrThrow<string>('MINIO_ENDPOINT'),
      port: Number(configService.getOrThrow<string>('MINIO_PORT')),
      useSSL: false,
      accessKey: configService.getOrThrow<string>('MINIO_ACCESS_KEY'),
      secretKey: configService.getOrThrow<string>('MINIO_SECRET_KEY'),
    });
  }

  async onModuleInit() {
    const exists = await this.client.bucketExists(this.bucketName);
    if (!exists) {
      await this.client.makeBucket(this.bucketName);
    }
  }

  get bucket() {
    return this.bucketName;
  }

  presignedPutObject(objectKey: string, expirySeconds = 10 * 60) {
    return this.client.presignedPutObject(
      this.bucketName,
      objectKey,
      expirySeconds,
    );
  }

  presignedGetObject(objectKey: string, expirySeconds = 10 * 60) {
    return this.client.presignedGetObject(
      this.bucketName,
      objectKey,
      expirySeconds,
    );
  }

  removeObject(objectKey: string) {
    return this.client.removeObject(this.bucketName, objectKey);
  }
}
