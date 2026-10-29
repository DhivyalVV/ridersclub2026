import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  CommunityMemberRole,
  CommunityMembershipStatus,
  CommunityVisibility,
  UserRole,
} from '@ridersclub/types';
import { CommunitiesService } from './communities.service';

describe('CommunitiesService', () => {
  const mockProfilesService = {
    mapUserWithProfileToPublicSummary: jest.fn((user: { id: string; role: string }) => ({
      id: user.id,
      displayName: 'Rider Member',
      username: 'rider_member',
      avatarUrl: null,
      bio: null,
      city: 'Pune',
      role: user.role as UserRole,
      canReceiveDirectMessage: true,
    })),
  };

  it('approves membership immediately when joining a PUBLIC community and sets PENDING for a PRIVATE community', async () => {
    const mockPrisma = {
      community: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'comm-public',
            visibility: CommunityVisibility.PUBLIC,
          })
          .mockResolvedValueOnce({
            id: 'comm-private',
            visibility: CommunityVisibility.PRIVATE,
          }),
      },
      communityMember: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest
          .fn()
          .mockImplementation(({ data }: { data: { status: string; role: string } }) =>
            Promise.resolve({
              id: 'mem-1',
              status: data.status,
              role: data.role,
            }),
          ),
      },
    };

    const service = new CommunitiesService(
      mockPrisma as never,
      mockProfilesService as never,
    );

    const publicJoin = await service.joinCommunity('comm-public', 'user-1');
    expect(publicJoin.status).toBe(CommunityMembershipStatus.APPROVED);

    const privateJoin = await service.joinCommunity('comm-private', 'user-1');
    expect(privateJoin.status).toBe(CommunityMembershipStatus.PENDING);
  });

  it('blocks non-members from reading PRIVATE community chat messages', async () => {
    const mockPrisma = {
      community: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'comm-private',
          visibility: CommunityVisibility.PRIVATE,
        }),
      },
      communityMember: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'mem-pending',
          status: CommunityMembershipStatus.PENDING,
          role: CommunityMemberRole.MEMBER,
        }),
      },
    };

    const service = new CommunitiesService(
      mockPrisma as never,
      mockProfilesService as never,
    );

    await expect(
      service.listMessages('comm-private', { sub: 'user-pending', role: UserRole.USER }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('prevents community founder from leaving their own community', async () => {
    const mockPrisma = {
      communityMember: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'mem-founder',
          role: CommunityMemberRole.FOUNDER,
          status: CommunityMembershipStatus.APPROVED,
        }),
      },
    };

    const service = new CommunitiesService(
      mockPrisma as never,
      mockProfilesService as never,
    );

    await expect(
      service.leaveCommunity('comm-1', 'founder-user'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows community founder to approve a pending member in a private community', async () => {
    const now = new Date();
    const mockPrisma = {
      community: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'comm-private',
          visibility: CommunityVisibility.PRIVATE,
        }),
      },
      communityMember: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'mem-founder',
          role: CommunityMemberRole.FOUNDER,
          status: CommunityMembershipStatus.APPROVED,
        }),
        update: jest.fn().mockResolvedValue({
          id: 'mem-target',
          communityId: 'comm-private',
          userId: 'applicant-user',
          role: CommunityMemberRole.MEMBER,
          status: CommunityMembershipStatus.APPROVED,
          createdAt: now,
          user: {
            id: 'applicant-user',
            role: UserRole.USER,
            phoneNumber: null,
            allowDirectMessages: 'EVERYONE',
            profile: null,
          },
        }),
      },
    };

    const service = new CommunitiesService(
      mockPrisma as never,
      mockProfilesService as never,
    );

    const approved = await service.approveMember('comm-private', 'applicant-user', {
      sub: 'founder-user',
      role: UserRole.USER,
    });

    expect(approved.status).toBe(CommunityMembershipStatus.APPROVED);
    expect(approved.userId).toBe('applicant-user');
  });
});

