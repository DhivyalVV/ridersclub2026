import { Injectable } from '@nestjs/common';
import { ApiHealthResponse } from '@ridersclub/types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async checkHealth(): Promise<ApiHealthResponse> {
    const startedAt = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const latencyMs = Date.now() - startedAt;

      return {
        status: 'ok',
        service: '@ridersclub/api',
        version: '0.1.0',
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          latencyMs,
        },
      };
    } catch {
      return {
        status: 'degraded',
        service: '@ridersclub/api',
        version: '0.1.0',
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
        },
      };
    }
  }
}

