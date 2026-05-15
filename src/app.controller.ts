import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AppService, HealthStatus } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Health check endpoint — used by Docker Compose health checks
   * and cloud load balancers (ECS, GCP, Railway, etc.)
   *
   * Returns 200 when status is 'ok', 503 when any service is down.
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async getHealth(): Promise<HealthStatus> {
    const health = await this.appService.getHealth();
    return health;
  }
}
