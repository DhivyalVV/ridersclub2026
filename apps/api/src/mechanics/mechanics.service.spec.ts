import { ConflictException, ForbiddenException } from '@nestjs/common';
import {
  MechanicVerificationStatus,
  UserRole,
  type PublicUserSummary,
} from '@ridersclub/types';
import { MechanicsService } from './mechanics.service';

describe('MechanicsService', () => {
  const mockOwnerSummary: PublicUserSummary = {
    id: 'user-mech-owner-1',
    displayName: 'Arjun Shetty',
    username: 'arjun_apexmoto',
    avatarUrl: null,
    bio: 'Master Technician',
    city: 'Bengaluru',
    role: UserRole.USER,
    canReceiveDirectMessage: true,
  };

  const mockProfilesService = {
    mapUserWithProfileToPublicSummary: jest.fn(() => mockOwnerSummary),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('defaults self-registered mechanics to PENDING_REVIEW and masks phone when contactPhonePublic is false', async () => {
    const createMock = jest.fn().mockImplementation(async ({ data }) => ({
      id: 'mech-new-1',
      ...data,
      createdAt: new Date('2026-10-22T12:00:00.000Z'),
      updatedAt: new Date('2026-10-22T12:00:00.000Z'),
      owner: { id: 'user-mech-owner-1', profile: null },
    }));

    const mockPrisma = {
      mechanicProfile: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: createMock,
      },
    };

    const service = new MechanicsService(
      mockPrisma as never,
      mockProfilesService as never,
    );

    const result = await service.registerMechanic('user-mech-owner-1', {
      businessName: 'Torque Factory Customs',
      description:
        'Big twin engine rebuilds, valve clearance checks, and dynotuning.',
      serviceCategories: ['Engine Rebuild', 'ECU Diagnostics'],
      address: '18 Koramangala 80ft Road',
      city: 'Bengaluru',
      contactPhone: '+91 98450 77812',
      contactPhonePublic: false,
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          verificationStatus: MechanicVerificationStatus.PENDING_REVIEW,
          verifiedAt: null,
          verifiedByAdminId: null,
          contactPhonePublic: false,
        }),
      }),
    );

    expect(result.verificationStatus).toBe(
      MechanicVerificationStatus.PENDING_REVIEW,
    );
    expect(result.verifiedAt).toBeNull();
    expect(result.displayPhone).toBe('+91 9845 •••12');
    expect(result.displayPhone).not.toContain('77812');
  });

  it('returns the full workshop phone when contactPhonePublic is true', async () => {
    const createMock = jest.fn().mockImplementation(async ({ data }) => ({
      id: 'mech-public-phone',
      ...data,
      createdAt: new Date('2026-10-22T12:00:00.000Z'),
      updatedAt: new Date('2026-10-22T12:00:00.000Z'),
      owner: { id: 'user-mech-owner-1', profile: null },
    }));

    const mockPrisma = {
      mechanicProfile: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: createMock,
      },
    };

    const service = new MechanicsService(
      mockPrisma as never,
      mockProfilesService as never,
    );

    const result = await service.registerMechanic('user-mech-owner-1', {
      businessName: 'Deccan Tire & Alignment',
      description: 'Laser wheel alignment and tubeless tire conversion.',
      serviceCategories: ['Tire Balancing'],
      address: 'Baner High Street',
      city: 'Pune',
      contactPhone: '+91 98450 77812',
      contactPhonePublic: true,
    });

    expect(result.contactPhonePublic).toBe(true);
    expect(result.displayPhone).toBe('+91 98450 77812');
  });

  it('rejects duplicate workshop registration by the same owner with ConflictException', async () => {
    const mockPrisma = {
      mechanicProfile: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'existing-mech',
          ownerId: 'user-mech-owner-1',
        }),
      },
    };

    const service = new MechanicsService(
      mockPrisma as never,
      mockProfilesService as never,
    );

    await expect(
      service.registerMechanic('user-mech-owner-1', {
        businessName: 'Second Shop',
        description: 'Duplicate registration attempt.',
        serviceCategories: ['Periodic Service'],
        address: 'MG Road',
        city: 'Bengaluru',
        contactPhone: '+91 98450 00000',
        contactPhonePublic: false,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects verification attempts from USER or MODERATOR roles with ForbiddenException', async () => {
    const mockPrisma = {
      mechanicProfile: {
        findUnique: jest.fn(),
      },
    };

    const service = new MechanicsService(
      mockPrisma as never,
      mockProfilesService as never,
    );

    await expect(
      service.verifyMechanic('mech-1', 'user-1', UserRole.USER, {
        status: MechanicVerificationStatus.VERIFIED,
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      service.verifyMechanic('mech-1', 'mod-1', UserRole.MODERATOR, {
        status: MechanicVerificationStatus.VERIFIED,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows ADMIN to verify a workshop and stamps verifiedAt and verifiedByAdminId', async () => {
    const updateMock = jest.fn().mockImplementation(async ({ data }) => ({
      id: 'mech-1',
      ownerId: 'user-mech-owner-1',
      businessName: 'Highway 44 Garage & Tire Center',
      description: '24x7 highway tire & brake specialist',
      serviceCategories: ['Tire Balancing', 'Brake Overhaul'],
      address: 'Plot 19, Medchal Highway Service Road',
      city: 'Hyderabad',
      contactPhone: '+91 90001 44288',
      contactPhonePublic: false,
      verificationStatus: data.verificationStatus,
      verifiedAt: data.verifiedAt,
      verifiedByAdminId: data.verifiedByAdminId,
      verificationNotes: data.verificationNotes,
      createdAt: new Date('2026-10-20T10:00:00.000Z'),
      updatedAt: new Date('2026-10-22T12:00:00.000Z'),
      owner: { id: 'user-mech-owner-1', profile: null },
    }));

    const mockPrisma = {
      mechanicProfile: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'mech-1',
          ownerId: 'user-mech-owner-1',
          verificationStatus: MechanicVerificationStatus.PENDING_REVIEW,
        }),
        update: updateMock,
      },
    };

    const service = new MechanicsService(
      mockPrisma as never,
      mockProfilesService as never,
    );

    const verified = await service.verifyMechanic(
      'mech-1',
      'admin-user-99',
      UserRole.ADMIN,
      {
        status: MechanicVerificationStatus.VERIFIED,
        verificationNotes: 'Trade license and GST certificate verified.',
      },
    );

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          verificationStatus: MechanicVerificationStatus.VERIFIED,
          verifiedByAdminId: 'admin-user-99',
          verificationNotes: 'Trade license and GST certificate verified.',
        }),
      }),
    );

    expect(verified.verificationStatus).toBe(
      MechanicVerificationStatus.VERIFIED,
    );
    expect(verified.verifiedAt).toBeTruthy();
    expect(verified.verificationNotes).toBe(
      'Trade license and GST certificate verified.',
    );
  });
});

