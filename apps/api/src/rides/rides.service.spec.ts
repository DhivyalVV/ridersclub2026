import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { RideStatus, UserRole } from '@ridersclub/types';
import { RidesService } from './rides.service';
import { OpenStreetMapRouteAdapter } from './route-map.provider';

describe('RidesService (Phase 8 Group Ride Organization & Capacity Enforcement)', () => {
  const mockProfilesService = {
    mapUserWithProfileToPublicSummary: jest.fn((user: { id: string; role: string }) => ({
      id: user.id,
      displayName: `Rider ${user.id}`,
      username: `rider_${user.id}`,
      avatarUrl: null,
      bio: null,
      city: 'Bengaluru',
      role: user.role as UserRole,
      canReceiveDirectMessage: true,
    })),
  };

  const routeMapAdapter = new OpenStreetMapRouteAdapter();

  it('rejects joining a ride inside a transaction when capacity is already full', async () => {
    const mockTx = {
      ride: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'ride-full-1',
          status: RideStatus.UPCOMING,
          capacity: 15,
        }),
      },
      rideParticipant: {
        findUnique: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(15),
        create: jest.fn(),
      },
    };

    const mockPrisma = {
      $transaction: jest.fn((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
    };

    const service = new RidesService(
      mockPrisma as never,
      mockProfilesService as never,
      routeMapAdapter,
    );

    await expect(service.joinRide('ride-full-1', 'rider-new')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(mockTx.rideParticipant.create).not.toHaveBeenCalled();
  });

  it('rejects joining a ride whose status is CANCELLED or COMPLETED', async () => {
    const mockTx = {
      ride: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'ride-cancelled-1',
          status: RideStatus.CANCELLED,
          capacity: 20,
        }),
      },
    };

    const mockPrisma = {
      $transaction: jest.fn((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
    };

    const service = new RidesService(
      mockPrisma as never,
      mockProfilesService as never,
      routeMapAdapter,
    );

    await expect(service.joinRide('ride-cancelled-1', 'rider-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('enforces organizer ownership when updating or cancelling a ride', async () => {
    const mockPrisma = {
      ride: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'ride-1',
          organizerId: 'organizer-user-1',
          _count: { participants: 5 },
        }),
        update: jest.fn(),
      },
    };

    const service = new RidesService(
      mockPrisma as never,
      mockProfilesService as never,
      routeMapAdapter,
    );

    await expect(
      service.cancelRide('ride-1', { sub: 'other-user-2', role: UserRole.USER }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('prevents reducing capacity below the current number of joined participants', async () => {
    const mockPrisma = {
      ride: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'ride-1',
          organizerId: 'organizer-user-1',
          _count: { participants: 12 },
        }),
      },
    };

    const service = new RidesService(
      mockPrisma as never,
      mockProfilesService as never,
      routeMapAdapter,
    );

    await expect(
      service.updateRide(
        'ride-1',
        { sub: 'organizer-user-1', role: UserRole.USER },
        { capacity: 8 },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('prevents ride organizer from leaving their own ride without cancelling it', async () => {
    const mockPrisma = {
      ride: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'ride-1',
          organizerId: 'organizer-user-1',
        }),
      },
    };

    const service = new RidesService(
      mockPrisma as never,
      mockProfilesService as never,
      routeMapAdapter,
    );

    await expect(service.leaveRide('ride-1', 'organizer-user-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

