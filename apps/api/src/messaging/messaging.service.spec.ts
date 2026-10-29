import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  AccountStatus,
  DirectMessagePrivacy,
  UserRole,
} from '@ridersclub/types';
import { MessagingRealtimeService } from './messaging-realtime.service';
import { MessagingService } from './messaging.service';

describe('MessagingService (Phase 7 Deduplicated 1:1 Messaging)', () => {
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

  it('rejects opening a 1:1 conversation with oneself', async () => {
    const realtimeService = new MessagingRealtimeService();
    const service = new MessagingService(
      {} as never,
      mockProfilesService as never,
      realtimeService,
    );

    await expect(
      service.openOrGetConversation('user-alpha', {
        recipientUserId: 'user-alpha',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deduplicates 1:1 conversations deterministically regardless of initiator order', async () => {
    const now = new Date();
    const upsertSpy = jest.fn().mockImplementation(({ where }: { where: { participantPairKey: string } }) =>
      Promise.resolve({
        id: 'conv-dedup-1',
        participantPairKey: where.participantPairKey,
        contextLabel: 'Community: Western Ghats ADV Tourers',
        lastMessageAt: null,
        updatedAt: now,
        participants: [
          {
            userId: 'user-alpha',
            user: {
              id: 'user-alpha',
              role: UserRole.USER,
              phoneNumber: null,
              allowDirectMessages: DirectMessagePrivacy.EVERYONE,
              profile: null,
            },
          },
          {
            userId: 'user-zeta',
            user: {
              id: 'user-zeta',
              role: UserRole.USER,
              phoneNumber: null,
              allowDirectMessages: DirectMessagePrivacy.EVERYONE,
              profile: null,
            },
          },
        ],
        messages: [],
      }),
    );

    const mockPrisma = {
      user: {
        findUnique: jest.fn().mockImplementation(({ where }: { where: { id: string } }) =>
          Promise.resolve({
            id: where.id,
            accountStatus: AccountStatus.ACTIVE,
            allowDirectMessages: DirectMessagePrivacy.EVERYONE,
            profile: null,
          }),
        ),
      },
      userBlock: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      conversation: {
        upsert: upsertSpy,
      },
    };

    const realtimeService = new MessagingRealtimeService();
    const service = new MessagingService(
      mockPrisma as never,
      mockProfilesService as never,
      realtimeService,
    );

    const first = await service.openOrGetConversation('user-zeta', {
      recipientUserId: 'user-alpha',
      contextLabel: 'Community: Western Ghats ADV Tourers',
    });

    const second = await service.openOrGetConversation('user-alpha', {
      recipientUserId: 'user-zeta',
    });

    expect(first.participantPairKey).toBe('user-alpha:user-zeta');
    expect(second.participantPairKey).toBe('user-alpha:user-zeta');
    expect(upsertSpy).toHaveBeenCalledTimes(2);
  });

  it('blocks starting a conversation when a UserBlock exists in either direction', async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-target',
          accountStatus: AccountStatus.ACTIVE,
          allowDirectMessages: DirectMessagePrivacy.EVERYONE,
          profile: null,
        }),
      },
      userBlock: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'blk-1', blockerId: 'user-target', blockedId: 'user-sender' },
        ]),
      },
    };

    const realtimeService = new MessagingRealtimeService();
    const service = new MessagingService(
      mockPrisma as never,
      mockProfilesService as never,
      realtimeService,
    );

    await expect(
      service.openOrGetConversation('user-sender', {
        recipientUserId: 'user-target',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('enforces DirectMessagePrivacy.COMMUNITY_PEERS_ONLY when users share no approved community', async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-target',
          accountStatus: AccountStatus.ACTIVE,
          allowDirectMessages: DirectMessagePrivacy.COMMUNITY_PEERS_ONLY,
          profile: null,
        }),
      },
      userBlock: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      communityMember: {
        findMany: jest.fn().mockResolvedValue([{ communityId: 'comm-1' }]),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    const realtimeService = new MessagingRealtimeService();
    const service = new MessagingService(
      mockPrisma as never,
      mockProfilesService as never,
      realtimeService,
    );

    await expect(
      service.openOrGetConversation('user-sender', {
        recipientUserId: 'user-target',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('sends a message, emits a real-time event, and marks unread messages as read', async () => {
    const now = new Date();
    const mockPrisma = {
      conversation: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'conv-1',
          participantPairKey: 'user-a:user-b',
          participants: [
            {
              id: 'part-a',
              userId: 'user-a',
              user: {
                id: 'user-a',
                allowDirectMessages: DirectMessagePrivacy.EVERYONE,
              },
            },
            {
              id: 'part-b',
              userId: 'user-b',
              user: {
                id: 'user-b',
                allowDirectMessages: DirectMessagePrivacy.EVERYONE,
              },
            },
          ],
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      userBlock: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      directMessage: {
        create: jest.fn().mockResolvedValue({
          id: 'msg-101',
          conversationId: 'conv-1',
          senderId: 'user-a',
          body: 'See you at the highway toll!',
          contextLabel: 'Ride: Nandi Hills Dawn Run',
          readAt: null,
          createdAt: now,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      conversationParticipant: {
        update: jest.fn().mockResolvedValue({}),
      },
    };

    const realtimeService = new MessagingRealtimeService();
    const emitSpy = jest.spyOn(realtimeService, 'emitEvent');

    const service = new MessagingService(
      mockPrisma as never,
      mockProfilesService as never,
      realtimeService,
    );

    const msg = await service.sendMessage('conv-1', 'user-a', {
      body: 'See you at the highway toll!',
      contextLabel: 'Ride: Nandi Hills Dawn Run',
    });

    expect(msg.id).toBe('msg-101');
    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'direct_message.created',
        conversationId: 'conv-1',
        participantPairKey: 'user-a:user-b',
      }),
    );

    const readResult = await service.markConversationRead('conv-1', 'user-b');
    expect(readResult).toEqual({ conversationId: 'conv-1', markedCount: 2 });
  });
});

