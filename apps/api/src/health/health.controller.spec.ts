import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let mockQueryRaw: jest.Mock;

  beforeEach(async () => {
    mockQueryRaw = jest.fn().mockResolvedValue([{ '?column?': 1 }]);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: mockQueryRaw,
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('returns status ok when PostgreSQL responds to SELECT 1', async () => {
    const result = await controller.getHealth();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('@ridersclub/api');
    expect(result.database.connected).toBe(true);
    expect(typeof result.database.latencyMs).toBe('number');
    expect(mockQueryRaw).toHaveBeenCalledTimes(1);
  });

  it('returns status degraded when PostgreSQL query throws', async () => {
    mockQueryRaw.mockRejectedValueOnce(new Error('Connection refused'));

    const result = await controller.getHealth();

    expect(result.status).toBe('degraded');
    expect(result.database.connected).toBe(false);
  });
});

