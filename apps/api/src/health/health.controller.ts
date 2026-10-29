import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiHealthResponse } from '@ridersclub/types';
import { HealthService } from './health.service';

@ApiTags('System Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check API and PostgreSQL database connectivity' })
  @ApiResponse({ status: 200, description: 'Returns API and database health status' })
  async getHealth(): Promise<ApiHealthResponse> {
    return this.healthService.checkHealth();
  }
}

