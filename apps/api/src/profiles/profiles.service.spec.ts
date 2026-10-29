import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AccountStatus,
  DirectMessagePrivacy,
  UserRole,
} from '@ridersclub/types';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from './profiles.service';

describe('ProfilesService (Privacy controls, phone masking & blocking rules)', () => {
  let service: ProfilesService;

  const mockPrisma = {
    userProfile: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    userBlock: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockAuthService = {
    mapUserToAccountDto: jest.fn((u) => u),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
  });

  it('hides phone number when showPhone is false and disables DM when blocked', async () => {
    mockPrisma.userProfile.findFirst.mockResolvedValueOnce({
      userId: 'target-user-1',
      displayName: 'Vikram Rao',
      username: 'vikram_adv',
      avatarUrl: null,
      bio: 'Marshal',
      city: 'Bengaluru',
      showPhone: false,
      user: {
        role: UserRole.MODERATOR,
        accountStatus: AccountStatus.ACTIVE,
        phoneNumber: '+919845099999',
        allowDirectMessages: DirectMessagePrivacy.EVERYONE,
      },
    });

    mockPrisma.userBlock.findMany.mockResolvedValueOnce([
      { blockerId: 'viewer-1', blockedId: 'target-user-1' },
    ]);

    const summary = await service.getPublicProfileByUsernameOrId(
      'vikram_adv',
      'viewer-1',
    );

    expect(summary.publicPhoneNumber).toBeNull();
    expect(summary.canReceiveDirectMessage).toBe(false);
    expect(summary.isBlockedByViewer).toBe(true);
  });

  it('rejects duplicate username during profile update', async () => {
    mockPrisma.userProfile.findUnique.mockResolvedValueOnce({
      userId: 'other-user-id',
      username: 'taken_handle',
    });

    await expect(
      service.updateMyProfile('my-user-id', { username: 'taken_handle' }),
    ).rejects.toThrow(ConflictException);
  });

  it('prevents a user from blocking themselves', async () => {
    await expect(service.blockUser('user-1', 'user-1')).rejects.toThrow(
      BadRequestException,
    );
  });
});

