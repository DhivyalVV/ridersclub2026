import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CommunityMemberRole,
  CommunityMembershipStatus,
  CommunityVisibility,
  DirectMessagePrivacy,
  UserRole,
  type CommunityChatMessageItem,
  type CommunityDetailResponse,
  type CommunityItem,
  type CommunityMemberItem,
} from '@ridersclub/types';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import { CreateCommunityDto, CreateCommunityMessageDto } from './dto/community.dto';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class CommunitiesService {
  private seededCheckComplete = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
  ) {}

  async listCommunities(params: {
    search?: string;
    category?: string;
    viewerId?: string;
  }): Promise<CommunityItem[]> {
    await this.ensureInitialCommunitiesSeeded();

    const search = params.search?.trim();
    const category = params.category?.trim();

    const communities = await this.prisma.community.findMany({
      where: {
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
      },
      include: {
        founder: { include: { profile: true } },
        members: {
          select: {
            userId: true,
            role: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return communities.map((community) =>
      this.mapCommunityToDto(community, params.viewerId),
    );
  }

  async getCommunityDetails(
    idOrSlug: string,
    viewer?: { sub: string; role: UserRole } | null,
  ): Promise<CommunityDetailResponse> {
    await this.ensureInitialCommunitiesSeeded();

    const isUuid = UUID_REGEX.test(idOrSlug);
    const community = await this.prisma.community.findFirst({
      where: isUuid
        ? { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }
        : { slug: idOrSlug },
      include: {
        founder: { include: { profile: true } },
        members: {
          include: {
            user: { include: { profile: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!community) {
      throw new NotFoundException('Community not found.');
    }

    const dto = this.mapCommunityToDto(community, viewer?.sub);

    const approvedMembers: CommunityMemberItem[] = community.members
      .filter((m) => m.status === CommunityMembershipStatus.APPROVED)
      .map((m) => ({
        id: m.id,
        communityId: m.communityId,
        userId: m.userId,
        role: m.role as CommunityMemberRole,
        status: m.status as CommunityMembershipStatus,
        joinedAt: m.createdAt.toISOString(),
        user: this.profilesService.mapUserWithProfileToPublicSummary(m.user),
      }));

    const canManageMembers =
      viewer?.role === UserRole.ADMIN ||
      dto.viewerRole === CommunityMemberRole.FOUNDER ||
      dto.viewerRole === CommunityMemberRole.MODERATOR;

    const pendingMembers: CommunityMemberItem[] = canManageMembers
      ? community.members
          .filter((m) => m.status === CommunityMembershipStatus.PENDING)
          .map((m) => ({
            id: m.id,
            communityId: m.communityId,
            userId: m.userId,
            role: m.role as CommunityMemberRole,
            status: m.status as CommunityMembershipStatus,
            joinedAt: m.createdAt.toISOString(),
            user: this.profilesService.mapUserWithProfileToPublicSummary(m.user),
          }))
      : [];

    return {
      community: dto,
      members: approvedMembers,
      pendingMembers,
    };
  }

  async createCommunity(
    founderId: string,
    dto: CreateCommunityDto,
  ): Promise<CommunityItem> {
    const slug = await this.generateUniqueSlug(dto.name);

    const created = await this.prisma.community.create({
      data: {
        founderId,
        slug,
        name: dto.name.trim(),
        description: dto.description.trim(),
        category: dto.category.trim(),
        visibility: dto.visibility,
        members: {
          create: {
            userId: founderId,
            role: CommunityMemberRole.FOUNDER,
            status: CommunityMembershipStatus.APPROVED,
          },
        },
      },
      include: {
        founder: { include: { profile: true } },
        members: {
          select: {
            userId: true,
            role: true,
            status: true,
          },
        },
      },
    });

    return this.mapCommunityToDto(created, founderId);
  }

  async joinCommunity(
    communityId: string,
    userId: string,
  ): Promise<{
    communityId: string;
    status: CommunityMembershipStatus;
    role: CommunityMemberRole;
  }> {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new NotFoundException('Community not found.');
    }

    const existing = await this.prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId,
        },
      },
    });

    if (existing) {
      return {
        communityId,
        status: existing.status as CommunityMembershipStatus,
        role: existing.role as CommunityMemberRole,
      };
    }

    const initialStatus =
      community.visibility === CommunityVisibility.PUBLIC
        ? CommunityMembershipStatus.APPROVED
        : CommunityMembershipStatus.PENDING;

    const membership = await this.prisma.communityMember.create({
      data: {
        communityId,
        userId,
        role: CommunityMemberRole.MEMBER,
        status: initialStatus,
      },
    });

    return {
      communityId,
      status: membership.status as CommunityMembershipStatus,
      role: membership.role as CommunityMemberRole,
    };
  }

  async leaveCommunity(
    communityId: string,
    userId: string,
  ): Promise<{ communityId: string; left: boolean }> {
    const membership = await this.prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('You are not a member of this community.');
    }

    if (membership.role === CommunityMemberRole.FOUNDER) {
      throw new BadRequestException(
        'Community founders cannot leave their own community without transferring ownership.',
      );
    }

    await this.prisma.communityMember.delete({
      where: { id: membership.id },
    });

    return { communityId, left: true };
  }

  async approveMember(
    communityId: string,
    targetUserId: string,
    actor: { sub: string; role: UserRole },
  ): Promise<CommunityMemberItem> {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new NotFoundException('Community not found.');
    }

    const actorMembership = await this.prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId: actor.sub,
        },
      },
    });

    const isAuthorized =
      actor.role === UserRole.ADMIN ||
      (actorMembership?.status === CommunityMembershipStatus.APPROVED &&
        (actorMembership.role === CommunityMemberRole.FOUNDER ||
          actorMembership.role === CommunityMemberRole.MODERATOR));

    if (!isAuthorized) {
      throw new ForbiddenException(
        'Only community founders, moderators, or admins can approve membership requests.',
      );
    }

    const updated = await this.prisma.communityMember.update({
      where: {
        communityId_userId: {
          communityId,
          userId: targetUserId,
        },
      },
      data: {
        status: CommunityMembershipStatus.APPROVED,
      },
      include: {
        user: { include: { profile: true } },
      },
    });

    return {
      id: updated.id,
      communityId: updated.communityId,
      userId: updated.userId,
      role: updated.role as CommunityMemberRole,
      status: updated.status as CommunityMembershipStatus,
      joinedAt: updated.createdAt.toISOString(),
      user: this.profilesService.mapUserWithProfileToPublicSummary(updated.user),
    };
  }

  async listMessages(
    communityId: string,
    viewer?: { sub: string; role: UserRole } | null,
  ): Promise<CommunityChatMessageItem[]> {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new NotFoundException('Community not found.');
    }

    if (community.visibility === CommunityVisibility.PRIVATE) {
      const isPlatformAdmin = viewer?.role === UserRole.ADMIN;
      if (!viewer) {
        throw new ForbiddenException(
          'This community is private. Sign in and join to view community chat.',
        );
      }

      if (!isPlatformAdmin) {
        const membership = await this.prisma.communityMember.findUnique({
          where: {
            communityId_userId: {
              communityId,
              userId: viewer.sub,
            },
          },
        });

        if (membership?.status !== CommunityMembershipStatus.APPROVED) {
          throw new ForbiddenException(
            'This community is private. Only approved members can view community chat.',
          );
        }
      }
    }

    const messages = await this.prisma.communityMessage.findMany({
      where: { communityId },
      include: {
        sender: { include: { profile: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    return messages.map((msg) => ({
      id: msg.id,
      communityId: msg.communityId,
      body: msg.body,
      createdAt: msg.createdAt.toISOString(),
      sender: this.profilesService.mapUserWithProfileToPublicSummary(msg.sender),
    }));
  }

  async postMessage(
    communityId: string,
    senderId: string,
    dto: CreateCommunityMessageDto,
  ): Promise<CommunityChatMessageItem> {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new NotFoundException('Community not found.');
    }

    const membership = await this.prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId: senderId,
        },
      },
    });

    if (membership?.status !== CommunityMembershipStatus.APPROVED) {
      throw new ForbiddenException(
        'Join this community (and be approved if private) before sending messages in community chat.',
      );
    }

    const created = await this.prisma.communityMessage.create({
      data: {
        communityId,
        senderId,
        body: dto.body.trim(),
      },
      include: {
        sender: { include: { profile: true } },
      },
    });

    return {
      id: created.id,
      communityId: created.communityId,
      body: created.body,
      createdAt: created.createdAt.toISOString(),
      sender: this.profilesService.mapUserWithProfileToPublicSummary(created.sender),
    };
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50) || 'riders-community';

    const existing = await this.prisma.community.findUnique({ where: { slug: base } });
    if (!existing) {
      return base;
    }

    return `${base}-${Math.random().toString(36).slice(2, 7)}`;
  }

  private mapCommunityToDto(
    community: {
      id: string;
      slug: string;
      name: string;
      description: string;
      category: string;
      visibility: string;
      createdAt: Date;
      founder: {
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
      members: Array<{
        userId: string;
        role: string;
        status: string;
      }>;
    },
    viewerId?: string,
  ): CommunityItem {
    const approvedCount = community.members.filter(
      (m) => m.status === CommunityMembershipStatus.APPROVED,
    ).length;

    const viewerRecord = viewerId
      ? community.members.find((m) => m.userId === viewerId)
      : undefined;

    return {
      id: community.id,
      slug: community.slug,
      name: community.name,
      description: community.description,
      category: community.category,
      visibility: community.visibility as CommunityVisibility,
      memberCount: approvedCount,
      founder: this.profilesService.mapUserWithProfileToPublicSummary(community.founder),
      viewerMembershipStatus: viewerRecord
        ? (viewerRecord.status as CommunityMembershipStatus)
        : null,
      viewerRole: viewerRecord ? (viewerRecord.role as CommunityMemberRole) : null,
      createdAt: community.createdAt.toISOString(),
    };
  }

  private async ensureInitialCommunitiesSeeded(): Promise<void> {
    if (this.seededCheckComplete) {
      return;
    }
    this.seededCheckComplete = true;

    try {
      const count = await this.prisma.community.count();
      if (count > 0) {
        return;
      }

      const founder1 = await this.prisma.user.upsert({
        where: { email: 'vikram.adv@ridersclub.example' },
        update: {},
        create: {
          email: 'vikram.adv@ridersclub.example',
          role: UserRole.MODERATOR,
          allowDirectMessages: DirectMessagePrivacy.EVERYONE,
          profile: {
            create: {
              username: 'vikram_adv',
              displayName: 'Vikramaditya Rao',
              bio: 'Lead ride marshal • Tiger 900 Rally Pro',
              city: 'Bengaluru',
            },
          },
        },
      });

      const founder2 = await this.prisma.user.upsert({
        where: { email: 'meera.torques@ridersclub.example' },
        update: {},
        create: {
          email: 'meera.torques@ridersclub.example',
          role: UserRole.ADMIN,
          allowDirectMessages: DirectMessagePrivacy.EVERYONE,
          profile: {
            create: {
              username: 'meera_torques',
              displayName: 'Meera Krishnan',
              bio: 'Automotive engineer & track-day coach',
              city: 'Chennai',
            },
          },
        },
      });

      const founder3 = await this.prisma.user.upsert({
        where: { email: 'rohan.apex@ridersclub.example' },
        update: {},
        create: {
          email: 'rohan.apex@ridersclub.example',
          role: UserRole.USER,
          allowDirectMessages: DirectMessagePrivacy.NONE,
          profile: {
            create: {
              username: 'rohan_apex',
              displayName: 'Rohan Deshmukh',
              bio: 'Track day organizer • privacy set to non-DM',
              city: 'Pune',
            },
          },
        },
      });

      const comm1 = await this.prisma.community.create({
        data: {
          founderId: founder1.id,
          slug: 'western-ghats-adv-tourers',
          name: 'Western Ghats ADV Tourers',
          description:
            'Weekend trail rides, monsoon preparedness checklists, and technical terrain mentorship across Karnataka, Goa, and Maharashtra.',
          category: 'Adventure & Touring',
          visibility: CommunityVisibility.PUBLIC,
          members: {
            create: [
              {
                userId: founder1.id,
                role: CommunityMemberRole.FOUNDER,
                status: CommunityMembershipStatus.APPROVED,
              },
              {
                userId: founder2.id,
                role: CommunityMemberRole.MEMBER,
                status: CommunityMembershipStatus.APPROVED,
              },
            ],
          },
          messages: {
            create: [
              {
                senderId: founder1.id,
                body: 'Welcome to Western Ghats ADV Tourers! Check your tire pressures and rain liners before the Sakleshpur trail run this Sunday.',
              },
              {
                senderId: founder2.id,
                body: 'Bringing the diagnostic scanner and spare tubeless repair plugs to the Hassan breakfast checkpoint.',
              },
            ],
          },
        },
      });

      await this.prisma.community.create({
        data: {
          founderId: founder2.id,
          slug: 'classic-modern-retro-mechanics-guild',
          name: 'Classic & Modern Retro Mechanics Guild',
          description:
            'Carburetor tuning, electrical wiring schematics, and restoration logs for twins, singles, and modern classic cars.',
          category: 'Maintenance & Builds',
          visibility: CommunityVisibility.PUBLIC,
          members: {
            create: [
              {
                userId: founder2.id,
                role: CommunityMemberRole.FOUNDER,
                status: CommunityMembershipStatus.APPROVED,
              },
            ],
          },
          messages: {
            create: [
              {
                senderId: founder2.id,
                body: 'Pinned: Valve clearance specifications and torque tables for 650cc parallel twins and air-cooled singles.',
              },
            ],
          },
        },
      });

      await this.prisma.community.create({
        data: {
          founderId: founder3.id,
          slug: 'deccan-gt-track-canyon-club',
          name: 'Deccan GT Track & Canyon Club',
          description:
            'Invite-only group for verified sportbike and performance sedan owners organizing track sessions and telemetry reviews.',
          category: 'Track & Performance',
          visibility: CommunityVisibility.PRIVATE,
          members: {
            create: [
              {
                userId: founder3.id,
                role: CommunityMemberRole.FOUNDER,
                status: CommunityMembershipStatus.APPROVED,
              },
            ],
          },
        },
      });

      void comm1;
    } catch {
      // Ignore seed race conditions
    }
  }
}

