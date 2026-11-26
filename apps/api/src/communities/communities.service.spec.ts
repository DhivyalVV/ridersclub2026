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

  it('blocks non-members from reading PUBLIC and PRIVATE community chat messages', async () => {
    const mockPrisma = {
      community: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'comm-private',
            visibility: CommunityVisibility.PRIVATE,
          })
          .mockResolvedValueOnce({
            id: 'comm-public',
            visibility: CommunityVisibility.PUBLIC,
          }),
      },
      communityMember: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'mem-pending',
            status: CommunityMembershipStatus.PENDING,
            role: CommunityMemberRole.MEMBER,
          })
          .mockResolvedValueOnce(null),
      },
    };

    const service = new CommunitiesService(
      mockPrisma as never,
      mockProfilesService as never,
    );

    await expect(
      service.listMessages('comm-private', { sub: 'user-pending', role: UserRole.USER }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      service.listMessages('comm-public', { sub: 'user-non-member', role: UserRole.USER }),
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

  it('prevents duplicate public communities globally and duplicate private communities for the same user while allowing 1 public and 1 private with the same name', async () => {
    const mockPrisma = {
      community: {
        findFirst: jest
          .fn()
          // 1. First call: trying to create duplicate PUBLIC community -> exists
          .mockResolvedValueOnce({ id: 'existing-public' })
          // 2. Second call: same user creating PRIVATE community with same name -> does not exist for user
          .mockResolvedValueOnce(null)
          // 3. Third call: same user trying to create duplicate PRIVATE community -> exists for user
          .mockResolvedValueOnce({ id: 'existing-private' }),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'comm-created-private',
          slug: 'western-ghats-adv-tourers',
          name: 'Western Ghats ADV Tourers',
          description: 'Private chapter',
          visibility: CommunityVisibility.PRIVATE,
          createdAt: new Date(),
          founder: {
            id: 'user-1',
            role: UserRole.USER,
            phoneNumber: null,
            allowDirectMessages: 'EVERYONE',
            profile: null,
          },
          members: [
            {
              userId: 'user-1',
              role: CommunityMemberRole.FOUNDER,
              status: CommunityMembershipStatus.APPROVED,
            },
          ],
          messages: [],
        }),
      },
    };

    const service = new CommunitiesService(
      mockPrisma as never,
      mockProfilesService as never,
    );

    await expect(
      service.createCommunity('user-1', {
        name: 'Western Ghats ADV Tourers',
        description: 'Duplicate public group',
        visibility: CommunityVisibility.PUBLIC,
      }),
    ).rejects.toThrow('Community already present, cannot create duplicate.');

    const createdPrivate = await service.createCommunity('user-1', {
      name: 'Western Ghats ADV Tourers',
      description: 'Private chapter with same name',
      visibility: CommunityVisibility.PRIVATE,
    });
    expect(createdPrivate.visibility).toBe(CommunityVisibility.PRIVATE);

    await expect(
      service.createCommunity('user-1', {
        name: 'Western Ghats ADV Tourers',
        description: 'Second private chapter with same name by same user',
        visibility: CommunityVisibility.PRIVATE,
      }),
    ).rejects.toThrow('Community already present, cannot create duplicate.');
  });

  describe('deleteCommunity permissions', () => {
    const publicCommunity = {
      id: 'comm-public',
      founderId: 'public-founder',
      visibility: CommunityVisibility.PUBLIC,
    };
    const privateCommunity = {
      id: 'comm-private',
      founderId: 'private-owner',
      visibility: CommunityVisibility.PRIVATE,
    };

    function buildService(community: object) {
      const mockPrisma = {
        community: {
          findUnique: jest.fn().mockResolvedValue(community),
          delete: jest.fn().mockResolvedValue(community),
        },
      };
      const service = new CommunitiesService(
        mockPrisma as never,
        mockProfilesService as never,
      );
      return { service, mockPrisma };
    }

    it('allows platform ADMIN to delete public and private communities', async () => {
      for (const community of [publicCommunity, privateCommunity]) {
        const { service, mockPrisma } = buildService(community);
        await expect(
          service.deleteCommunity(community.id, { sub: 'admin-1', role: UserRole.ADMIN }),
        ).resolves.toEqual({ communityId: community.id, deleted: true });
        expect(mockPrisma.community.delete).toHaveBeenCalledWith({
          where: { id: community.id },
        });
      }
    });

    it('prevents general users (including the founder) from deleting a public community', async () => {
      for (const sub of ['public-founder', 'random-user']) {
        const { service, mockPrisma } = buildService(publicCommunity);
        await expect(
          service.deleteCommunity('comm-public', { sub, role: UserRole.USER }),
        ).rejects.toBeInstanceOf(ForbiddenException);
        expect(mockPrisma.community.delete).not.toHaveBeenCalled();
      }
    });

    it('allows the owner of a private community to delete it but not other users', async () => {
      const owner = buildService(privateCommunity);
      await expect(
        owner.service.deleteCommunity('comm-private', {
          sub: 'private-owner',
          role: UserRole.USER,
        }),
      ).resolves.toEqual({ communityId: 'comm-private', deleted: true });

      const stranger = buildService(privateCommunity);
      await expect(
        stranger.service.deleteCommunity('comm-private', {
          sub: 'someone-else',
          role: UserRole.MODERATOR,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(stranger.mockPrisma.community.delete).not.toHaveBeenCalled();
    });
  });
});

