import { ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  DirectMessagePrivacy,
  ModerationTargetType,
  ReportStatus,
  UserRole,
  VehicleType,
} from '@ridersclub/types';
import { AdminController } from '../admin/admin.controller';
import { AppModule } from '../app.module';
import { AuthController } from '../auth/auth.controller';
import { BlogsController } from '../blogs/blogs.controller';
import { CommunitiesController } from '../communities/communities.controller';
import { GarageController } from '../garage/garage.controller';
import { HealthController } from '../health/health.controller';
import { HelpController } from '../help/help.controller';
import { MarketplaceController } from '../marketplace/marketplace.controller';
import { MechanicsController } from '../mechanics/mechanics.controller';
import { MessagingController } from '../messaging/messaging.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesController } from '../profiles/profiles.controller';
import { RidesController } from '../rides/rides.controller';

describe('RidersClub NestJS Modular Monolith Integration Suite (Phase 14)', () => {
  let moduleRef: TestingModule;

  const mockAdminUser = {
    id: 'user-admin-int-1',
    email: 'admin.int@ridersclub.example',
    phoneNumber: '+919845011122',
    role: UserRole.ADMIN,
    allowDirectMessages: DirectMessagePrivacy.EVERYONE,
    profile: {
      userId: 'user-admin-int-1',
      username: 'int_admin',
      displayName: 'Integration Admin',
      bio: 'Platform Integration Tester',
      avatarUrl: null,
      city: 'Bengaluru',
      showPhone: false,
    },
  };

  const mockPrisma: Record<string, unknown> = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb(mockPrisma),
    ),
    user: {
      count: jest.fn().mockResolvedValue(25),
      findUnique: jest.fn().mockResolvedValue(mockAdminUser),
      upsert: jest.fn().mockResolvedValue(mockAdminUser),
      update: jest.fn().mockResolvedValue(mockAdminUser),
    },
    contentReport: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue({
        id: 'rep-int-1',
        reporterId: mockAdminUser.id,
        targetType: ModerationTargetType.LISTING,
        targetId: 'list-int-1',
        targetLabel: 'Integration Flagged Listing',
        reason: 'Advance payment requested',
        status: ReportStatus.OPEN,
      }),
      create: jest.fn().mockImplementation(
        async ({
          data,
        }: {
          data: {
            reporterId: string;
            targetType: string;
            targetId: string;
            targetLabel: string;
            reason: string;
            status: string;
          };
        }) => ({
          id: 'rep-int-created',
          ...data,
          resolutionNotes: null,
          resolvedById: null,
          resolvedAt: null,
          createdAt: new Date('2026-10-22T10:00:00.000Z'),
          updatedAt: new Date('2026-10-22T10:00:00.000Z'),
          reporter: mockAdminUser,
        }),
      ),
      update: jest.fn().mockImplementation(
        async ({
          data,
        }: {
          data: {
            status: string;
            resolutionNotes: string | null;
            resolvedById: string;
            resolvedAt: Date;
          };
        }) => ({
          id: 'rep-int-1',
          reporterId: mockAdminUser.id,
          targetType: ModerationTargetType.LISTING,
          targetId: 'list-int-1',
          targetLabel: 'Integration Flagged Listing',
          reason: 'Advance payment requested',
          status: data.status,
          resolutionNotes: data.resolutionNotes,
          resolvedById: data.resolvedById,
          resolvedAt: data.resolvedAt,
          createdAt: new Date('2026-10-22T10:00:00.000Z'),
          updatedAt: new Date('2026-10-22T10:05:00.000Z'),
          reporter: mockAdminUser,
        }),
      ),
    },
    moderationAuditLog: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation(
        async ({
          data,
        }: {
          data: {
            actorId: string;
            action: string;
            targetType: string;
            targetId: string;
            reason: string;
          };
        }) => ({
          id: 'audit-int-1',
          ...data,
          createdAt: new Date('2026-10-22T10:05:00.000Z'),
          actor: mockAdminUser,
        }),
      ),
    },
    mechanicProfile: {
      count: jest.fn().mockResolvedValue(2),
    },
    ride: {
      count: jest.fn().mockResolvedValue(3),
    },
    helpRequest: {
      count: jest.fn().mockResolvedValue(1),
    },
    marketplaceListing: {
      count: jest.fn().mockResolvedValue(4),
      create: jest.fn().mockImplementation(
        async ({
          data,
        }: {
          data: {
            sellerId: string;
            vehicleType: string;
            make: string;
            model: string;
            year: number;
            odometerKm: number;
            askingPriceInr: number;
            description: string;
            location: string;
            status: string;
            photos?: { create?: Array<Record<string, unknown>> };
          };
        }) => ({
          id: 'list-int-new',
          ...data,
          createdAt: new Date('2026-10-22T11:00:00.000Z'),
          updatedAt: new Date('2026-10-22T11:00:00.000Z'),
          seller: mockAdminUser,
          photos: (data.photos?.create ?? []).map((p, idx) => ({
            id: `photo-int-${idx}`,
            listingId: 'list-int-new',
            ...p,
          })),
        }),
      ),
    },
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await moduleRef?.close();
  });

  it('wires all 12 domain controllers cleanly in the AppModule DI container', () => {
    expect(moduleRef.get(HealthController)).toBeDefined();
    expect(moduleRef.get(AuthController)).toBeDefined();
    expect(moduleRef.get(ProfilesController)).toBeDefined();
    expect(moduleRef.get(BlogsController)).toBeDefined();
    expect(moduleRef.get(CommunitiesController)).toBeDefined();
    expect(moduleRef.get(MessagingController)).toBeDefined();
    expect(moduleRef.get(RidesController)).toBeDefined();
    expect(moduleRef.get(HelpController)).toBeDefined();
    expect(moduleRef.get(MechanicsController)).toBeDefined();
    expect(moduleRef.get(GarageController)).toBeDefined();
    expect(moduleRef.get(MarketplaceController)).toBeDefined();
    expect(moduleRef.get(AdminController)).toBeDefined();
  });

  it('executes HealthController -> HealthService -> Prisma connectivity check end-to-end', async () => {
    const healthController = moduleRef.get(HealthController);
    const health = await healthController.getHealth();

    expect(health.status).toBe('ok');
    expect(health.service).toBe('@ridersclub/api');
    expect(health.database.connected).toBe(true);
  });

  it('executes Marketplace listing creation -> Content Report filing -> Admin moderation resolution & audit trail end-to-end', async () => {
    const marketplaceController = moduleRef.get(MarketplaceController);
    const adminController = moduleRef.get(AdminController);

    const actorJwt = {
      sub: mockAdminUser.id,
      email: mockAdminUser.email,
      role: UserRole.ADMIN,
      sessionId: 'session-int-1',
      type: 'access' as const,
      iat: 1700000000,
      exp: 1700003600,
    };

    const listing = await marketplaceController.createListing(actorJwt, {
      vehicleType: VehicleType.MOTORCYCLE,
      make: 'Suzuki',
      model: 'Hayabusa Gen 3',
      year: 2024,
      odometerKm: 2800,
      askingPriceInr: 1620000,
      description: 'Single owner, full service record at Suzuki Big Bike.',
      location: 'Bengaluru, KA',
      photos: [
        {
          fileName: 'hayabusa-front.webp',
          mimeType: 'image/webp',
          sizeBytes: 540000,
        },
      ],
    });

    expect(listing.make).toBe('Suzuki');
    expect(listing.photos).toHaveLength(1);

    const createdReport = await adminController.createReport(actorJwt, {
      targetType: ModerationTargetType.LISTING,
      targetId: listing.id,
      targetLabel: `${listing.year} ${listing.make} ${listing.model}`,
      reason: 'Routine high-value listing verification check.',
    });

    expect(createdReport.status).toBe(ReportStatus.OPEN);

    const resolved = await adminController.resolveReport(
      'rep-int-1',
      actorJwt,
      {
        status: ReportStatus.ACTIONED,
        actionTaken: 'LISTING_MODERATED_ACTIONED',
        resolutionNotes: 'Confirmed advance payment policy violation.',
      },
    );

    expect(resolved.report.status).toBe(ReportStatus.ACTIONED);
    expect(resolved.auditLog.action).toBe('LISTING_MODERATED_ACTIONED');
  });
});

