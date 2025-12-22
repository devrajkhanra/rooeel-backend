import './setup-env';
import { NestFactory } from '@nestjs/core';
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

  // Add global HTTP logging interceptor if enabled
  if (process.env.ENABLE_HTTP_LOGGING !== 'false') {
    app.useGlobalInterceptors(new HttpLoggerInterceptor());
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
