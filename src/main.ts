import './setup-env';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { CustomLogger } from './logger/logger.service';
import { HttpLoggerInterceptor } from './logger/http-logger.interceptor';

async function bootstrap() {

  const logger = new CustomLogger();
  logger.setContext('NestApplication');

  const app = await NestFactory.create(AppModule, {
    logger: logger,
  });

  // Enable CORS
  app.enableCors();

  // Security headers
  app.use(helmet());

  // Compression
  app.use(compression());

  // Global Validation Pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Add global HTTP logging interceptor if enabled
  if (process.env.ENABLE_HTTP_LOGGING !== 'false') {
    app.useGlobalInterceptors(new HttpLoggerInterceptor());
  }

  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
