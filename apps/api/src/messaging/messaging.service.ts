import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountStatus,
  CommunityMembershipStatus,
  DirectMessagePrivacy,
  buildConversationPairKey,
  type DirectConversationItem,
  type DirectMessageItem,
} from '@ridersclub/types';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import { OpenConversationDto, SendDirectMessageDto } from './dto/messaging.dto';
import { MessagingRealtimeService } from './messaging-realtime.service';

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
    private readonly realtimeService: MessagingRealtimeService,
  ) {}

  async listMyConversations(userId: string): Promise<DirectConversationItem[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              include: { profile: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
    });

    return conversations
      .map((conv) => this.mapConversationToDto(conv, userId))
      .filter((item): item is DirectConversationItem => item !== null);
  }

  async openOrGetConversation(
    currentUserId: string,
    dto: OpenConversationDto,
  ): Promise<DirectConversationItem> {
    const recipientUserId = dto.recipientUserId.trim();

    if (currentUserId === recipientUserId) {
      throw new BadRequestException('Cannot start a 1:1 conversation with yourself.');
    }

    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientUserId },
      include: { profile: true },
    });

    if (!recipient || recipient.accountStatus !== AccountStatus.ACTIVE) {
      throw new NotFoundException('Recipient rider account not found.');
    }

    await this.assertCanMessageTarget(currentUserId, recipient);

    const participantPairKey = buildConversationPairKey(currentUserId, recipientUserId);

    const conversation = await this.prisma.conversation.upsert({
      where: { participantPairKey },
      update: {
        ...(dto.contextLabel ? { contextLabel: dto.contextLabel.trim() } : {}),
      },
      create: {
        participantPairKey,
        contextLabel: dto.contextLabel?.trim() || null,
        participants: {
          create: [{ userId: currentUserId }, { userId: recipientUserId }],
        },
      },
      include: {
        participants: {
          include: {
            user: { include: { profile: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
      },
    });

    const mapped = this.mapConversationToDto(conversation, currentUserId);
    if (!mapped) {
      throw new NotFoundException('Failed to resolve conversation participants.');
    }

    return mapped;
  }

  async listMessages(
    conversationId: string,
    userId: string,
  ): Promise<DirectMessageItem[]> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    const isParticipant = conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant in this conversation.');
    }

    return conversation.messages.map((m) => this.mapMessageToDto(m));
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    dto: SendDirectMessageDto,
  ): Promise<DirectMessageItem> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    const senderParticipant = conversation.participants.find(
      (p) => p.userId === senderId,
    );
    const peerParticipant = conversation.participants.find(
      (p) => p.userId !== senderId,
    );

    if (!senderParticipant || !peerParticipant) {
      throw new ForbiddenException('You are not a participant in this conversation.');
    }

    await this.assertCanMessageTarget(senderId, peerParticipant.user);

    const now = new Date();
    const trimmedContext = dto.contextLabel?.trim() || null;

    const createdMessage = await this.prisma.directMessage.create({
      data: {
        conversationId,
        senderId,
        body: dto.body.trim(),
        contextLabel: trimmedContext,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: now,
        ...(trimmedContext ? { contextLabel: trimmedContext } : {}),
      },
    });

    await this.prisma.conversationParticipant.update({
      where: { id: senderParticipant.id },
      data: { lastReadAt: now },
    });

    const messageDto = this.mapMessageToDto(createdMessage);

    this.realtimeService.emitEvent({
      type: 'direct_message.created',
      conversationId,
      participantPairKey: conversation.participantPairKey,
      recipientUserIds: [senderId, peerParticipant.userId],
      message: messageDto,
    });

    return messageDto;
  }

  async markConversationRead(
    conversationId: string,
    userId: string,
  ): Promise<{ conversationId: string; markedCount: number }> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    const viewerParticipant = conversation.participants.find(
      (p) => p.userId === userId,
    );
    const peerParticipant = conversation.participants.find(
      (p) => p.userId !== userId,
    );

    if (!viewerParticipant) {
      throw new ForbiddenException('You are not a participant in this conversation.');
    }

    const now = new Date();

    const updateResult = await this.prisma.directMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: {
        readAt: now,
      },
    });

    await this.prisma.conversationParticipant.update({
      where: { id: viewerParticipant.id },
      data: { lastReadAt: now },
    });

    if (updateResult.count > 0 && peerParticipant) {
      this.realtimeService.emitEvent({
        type: 'direct_message.read',
        conversationId,
        participantPairKey: conversation.participantPairKey,
        recipientUserIds: [userId, peerParticipant.userId],
      });
    }

    return {
      conversationId,
      markedCount: updateResult.count,
    };
  }

  private async assertCanMessageTarget(
    senderId: string,
    recipient: {
      id: string;
      allowDirectMessages: string;
    },
  ): Promise<void> {
    const blocks = await this.prisma.userBlock.findMany({
      where: {
        OR: [
          { blockerId: senderId, blockedId: recipient.id },
          { blockerId: recipient.id, blockedId: senderId },
        ],
      },
    });

    if (blocks.length > 0) {
      throw new ForbiddenException(
        'Cannot message this user due to a block restriction.',
      );
    }

    if (recipient.allowDirectMessages === DirectMessagePrivacy.NONE) {
      throw new ForbiddenException('This user has disabled direct messages.');
    }

    if (
      recipient.allowDirectMessages === DirectMessagePrivacy.COMMUNITY_PEERS_ONLY
    ) {
      const senderMemberships = await this.prisma.communityMember.findMany({
        where: {
          userId: senderId,
          status: CommunityMembershipStatus.APPROVED,
        },
        select: { communityId: true },
      });

      const senderCommunityIds = senderMemberships.map((m) => m.communityId);

      if (senderCommunityIds.length === 0) {
        throw new ForbiddenException(
          'This user only accepts direct messages from fellow community members.',
        );
      }

      const sharedMembership = await this.prisma.communityMember.findFirst({
        where: {
          userId: recipient.id,
          status: CommunityMembershipStatus.APPROVED,
          communityId: { in: senderCommunityIds },
        },
      });

      if (!sharedMembership) {
        throw new ForbiddenException(
          'This user only accepts direct messages from fellow community members.',
        );
      }
    }
  }

  private mapConversationToDto(
    conv: {
      id: string;
      participantPairKey: string;
      contextLabel: string | null;
      lastMessageAt: Date | null;
      updatedAt: Date;
      participants: Array<{
        userId: string;
        user: {
          id: string;
          role: string;
          phoneNumber: string | null;
          allowDirectMessages: string;
          profile: {
            userId: string;
            displayName: string;
            username: string;
            avatarUrl: string | null;
            bio: string | null;
            city: string | null;
            showPhone: boolean;
          } | null;
        };
      }>;
      messages: Array<{
        id: string;
        conversationId: string;
        senderId: string;
        body: string;
        contextLabel: string | null;
        readAt: Date | null;
        createdAt: Date;
      }>;
    },
    viewerId: string,
  ): DirectConversationItem | null {
    const peerRecord = conv.participants.find((p) => p.userId !== viewerId);
    if (!peerRecord) {
      return null;
    }

    const unreadCount = conv.messages.filter(
      (m) => m.senderId !== viewerId && m.readAt === null,
    ).length;

    return {
      id: conv.id,
      participantPairKey: conv.participantPairKey,
      peer: this.profilesService.mapUserWithProfileToPublicSummary(peerRecord.user),
      contextLabel: conv.contextLabel,
      unreadCount,
      lastMessageAt: conv.lastMessageAt ? conv.lastMessageAt.toISOString() : null,
      updatedAt: conv.updatedAt.toISOString(),
      messages: conv.messages.map((m) => this.mapMessageToDto(m)),
    };
  }

  private mapMessageToDto(msg: {
    id: string;
    conversationId: string;
    senderId: string;
    body: string;
    contextLabel: string | null;
    readAt: Date | null;
    createdAt: Date;
  }): DirectMessageItem {
    return {
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      body: msg.body,
      contextLabel: msg.contextLabel,
      readAt: msg.readAt ? msg.readAt.toISOString() : null,
      createdAt: msg.createdAt.toISOString(),
    };
  }
}

