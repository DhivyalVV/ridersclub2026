import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  HelpCategory,
  HelpRequestStatus,
  UserRole,
  type PublicUserSummary,
} from '@ridersclub/types';
import { HelpService } from './help.service';

describe('HelpService', () => {
  const mockRequesterSummary: PublicUserSummary = {
    id: 'user-requester-1',
    displayName: 'Karthik Nair',
    username: 'karthik_xpulse',
    avatarUrl: null,
    bio: 'XPulse 200 4V',
    city: 'Bengaluru',
    role: UserRole.USER,
    canReceiveDirectMessage: true,
  };

  const mockProfilesService = {
    mapUserWithProfileToPublicSummary: jest.fn(() => mockRequesterSummary),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('refuses to store or return GPS coordinates when locationConsentGranted is false', async () => {
    const createMock = jest.fn().mockImplementation(async ({ data }) => ({
      id: 'help-no-consent',
      ...data,
      resolvedAt: null,
      createdAt: new Date('2026-10-22T10:00:00.000Z'),
      updatedAt: new Date('2026-10-22T10:00:00.000Z'),
      requester: { id: 'user-requester-1', profile: null },
      offers: [],
    }));

    const mockPrisma = {
      helpRequest: {
        create: createMock,
      },
    };

    const service = new HelpService(
      mockPrisma as never,
      mockProfilesService as never,
    );

    const result = await service.createHelpRequest('user-requester-1', {
      category: HelpCategory.FLAT_TIRE,
      description: 'Need portable air pump near highway toll.',
      locationConsentGranted: false,
      locationLabel: 'Secret exact spot',
      latitude: 13.3409,
      longitude: 77.101,
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          locationConsentGranted: false,
          latitude: null,
          longitude: null,
          locationLabel: 'Location hidden (Contact via 1:1 chat for exact spot)',
        }),
      }),
    );

    expect(result.locationSharedWithConsent).toBe(false);
    expect(result.latitude).toBeNull();
    expect(result.longitude).toBeNull();
    expect(result.externalMapUrl).toBeNull();
  });

  it('stores coordinates and builds an external OpenStreetMap URL when locationConsentGranted is true', async () => {
    const createMock = jest.fn().mockImplementation(async ({ data }) => ({
      id: 'help-with-consent',
      ...data,
      resolvedAt: null,
      createdAt: new Date('2026-10-22T10:00:00.000Z'),
      updatedAt: new Date('2026-10-22T10:00:00.000Z'),
      requester: { id: 'user-requester-1', profile: null },
      offers: [],
    }));

    const mockPrisma = {
      helpRequest: {
        create: createMock,
      },
    };

    const service = new HelpService(
      mockPrisma as never,
      mockProfilesService as never,
    );

    const result = await service.createHelpRequest('user-requester-1', {
      category: HelpCategory.OUT_OF_FUEL,
      description: 'Ran out of petrol 4km before highway exit.',
      vehicleSummary: 'KTM 390 Adventure',
      locationConsentGranted: true,
      locationLabel: 'NH-48 Milestone 62',
      latitude: 13.3409,
      longitude: 77.101,
    });

    expect(result.locationSharedWithConsent).toBe(true);
    expect(result.latitude).toBe(13.3409);
    expect(result.longitude).toBe(77.101);
    expect(result.externalMapUrl).toContain('openstreetmap.org');
  });

  it('automatically redacts GPS coordinates when status transitions to RESOLVED', async () => {
    const updateMock = jest.fn().mockImplementation(async ({ data }) => ({
      id: 'help-1',
      requesterId: 'user-requester-1',
      category: HelpCategory.FLAT_TIRE,
      description: 'Tube puncture fixed.',
      vehicleSummary: 'XPulse 200',
      status: data.status,
      locationConsentGranted: data.locationConsentGranted,
      locationLabel: data.locationLabel,
      latitude: data.latitude,
      longitude: data.longitude,
      resolvedAt: data.resolvedAt,
      createdAt: new Date('2026-10-22T09:00:00.000Z'),
      updatedAt: new Date('2026-10-22T10:00:00.000Z'),
      requester: { id: 'user-requester-1', profile: null },
      offers: [],
    }));

    const mockPrisma = {
      helpRequest: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'help-1',
          requesterId: 'user-requester-1',
          status: HelpRequestStatus.OPEN,
          resolvedAt: null,
        }),
        update: updateMock,
      },
    };

    const service = new HelpService(
      mockPrisma as never,
      mockProfilesService as never,
    );

    const result = await service.updateStatus(
      'help-1',
      {
        sub: 'user-requester-1',
        role: UserRole.USER,
        sessionId: 'sess-1',
        iat: 1,
        exp: 2,
      },
      { status: HelpRequestStatus.RESOLVED },
    );

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: HelpRequestStatus.RESOLVED,
          locationConsentGranted: false,
          latitude: null,
          longitude: null,
          locationLabel: 'Location auto-redacted after request closure',
        }),
      }),
    );

    expect(result.status).toBe(HelpRequestStatus.RESOLVED);
    expect(result.locationSharedWithConsent).toBe(false);
    expect(result.latitude).toBeNull();
    expect(result.longitude).toBeNull();
  });

  it('rejects status updates from non-owner non-moderator users with ForbiddenException', async () => {
    const mockPrisma = {
      helpRequest: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'help-1',
          requesterId: 'user-requester-1',
          status: HelpRequestStatus.OPEN,
        }),
      },
    };

    const service = new HelpService(
      mockPrisma as never,
      mockProfilesService as never,
    );

    await expect(
      service.updateStatus(
        'help-1',
        {
          sub: 'intruder-user',
          role: UserRole.USER,
          sessionId: 'sess-2',
          iat: 1,
          exp: 2,
        },
        { status: HelpRequestStatus.CANCELLED },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('prevents self-offers and transitions status to ASSISTANCE_OFFERED when a peer offers help', async () => {
    const mockPrisma = {
      $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
        cb({
          helpRequest: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'help-1',
              requesterId: 'user-requester-1',
              status: HelpRequestStatus.OPEN,
            }),
            update: jest.fn().mockResolvedValue({
              id: 'help-1',
              requesterId: 'user-requester-1',
              category: HelpCategory.BATTERY_JUMP,
              description: 'Need jump start.',
              vehicleSummary: 'Octavia TDI',
              status: HelpRequestStatus.ASSISTANCE_OFFERED,
              locationConsentGranted: false,
              locationLabel: 'Location hidden',
              latitude: null,
              longitude: null,
              resolvedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              requester: { id: 'user-requester-1', profile: null },
              offers: [
                {
                  id: 'offer-1',
                  helpRequestId: 'help-1',
                  helperId: 'helper-user-2',
                  note: 'Bringing jump leads in 10m',
                  createdAt: new Date(),
                  helper: { id: 'helper-user-2', profile: null },
                },
              ],
            }),
          },
          helpRequestOffer: {
            upsert: jest.fn().mockResolvedValue({}),
          },
        }),
      ),
    };

    const service = new HelpService(
      mockPrisma as never,
      mockProfilesService as never,
    );

    await expect(
      service.offerAssistance('help-1', 'user-requester-1', {
        note: 'Trying to help myself',
      }),
    ).rejects.toThrow(BadRequestException);

    const updated = await service.offerAssistance('help-1', 'helper-user-2', {
      note: 'Bringing jump leads in 10m',
    });

    expect(updated.status).toBe(HelpRequestStatus.ASSISTANCE_OFFERED);
    expect(updated.offersCount).toBe(1);
    expect(updated.isOfferedByViewer).toBe(true);
  });
});

