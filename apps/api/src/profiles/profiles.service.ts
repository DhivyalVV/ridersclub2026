import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountStatus,
  DirectMessagePrivacy,
  UserRole,
  type AuthenticatedUserAccount,
  type PublicUserSummary,
} from '@ridersclub/types';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async listPublicProfiles(
    search?: string,
    viewerId?: string,
  ): Promise<PublicUserSummary[]> {
    const trimmed = search?.trim();
    const blockedSet = viewerId
      ? await this.getBiDirectionalBlockedUserIds(viewerId)
      : new Set<string>();
    const viewerBlockedSet = viewerId
      ? await this.getViewerBlockedUserIds(viewerId)
      : new Set<string>();

    const profiles = await this.prisma.userProfile.findMany({
      where: {
        user: {
          accountStatus: AccountStatus.ACTIVE,
        },
        ...(trimmed
          ? {
              OR: [
                { displayName: { contains: trimmed, mode: 'insensitive' } },
                { username: { contains: trimmed, mode: 'insensitive' } },
                { city: { contains: trimmed, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return profiles.map((p) =>
      this.toPublicUserSummary(p, blockedSet.has(p.userId), viewerBlockedSet.has(p.userId)),
    );
  }

  async getPublicProfileByUsernameOrId(
    usernameOrId: string,
    viewerId?: string,
  ): Promise<PublicUserSummary> {
    const isUuid = UUID_REGEX.test(usernameOrId);

    const profile = await this.prisma.userProfile.findFirst({
      where: isUuid
        ? { OR: [{ userId: usernameOrId }, { username: usernameOrId }] }
        : { username: usernameOrId.toLowerCase() },
      include: { user: true },
    });

    if (!profile || profile.user.accountStatus !== AccountStatus.ACTIVE) {
      throw new NotFoundException('Rider profile not found.');
    }

    let isBlockedEitherWay = false;
    let isBlockedByViewer = false;

    if (viewerId && viewerId !== profile.userId) {
      const blocks = await this.prisma.userBlock.findMany({
        where: {
          OR: [
            { blockerId: viewerId, blockedId: profile.userId },
            { blockerId: profile.userId, blockedId: viewerId },
          ],
        },
      });
      isBlockedEitherWay = blocks.length > 0;
      isBlockedByViewer = blocks.some((b) => b.blockerId === viewerId);
    }

    return this.toPublicUserSummary(profile, isBlockedEitherWay, isBlockedByViewer);
  }

  async updateMyProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<AuthenticatedUserAccount> {
    if (dto.username) {
      const normalizedUsername = dto.username.trim().toLowerCase();
      const existing = await this.prisma.userProfile.findUnique({
        where: { username: normalizedUsername },
      });

      if (existing && existing.userId !== userId) {
        throw new ConflictException(`Username @${normalizedUsername} is already taken.`);
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.allowDirectMessages !== undefined
          ? { allowDirectMessages: dto.allowDirectMessages }
          : {}),
        profile: {
          update: {
            ...(dto.displayName !== undefined
              ? { displayName: dto.displayName.trim() }
              : {}),
            ...(dto.username !== undefined
              ? { username: dto.username.trim().toLowerCase() }
              : {}),
            ...(dto.bio !== undefined ? { bio: dto.bio?.trim() || null } : {}),
            ...(dto.city !== undefined ? { city: dto.city?.trim() || null } : {}),
            ...(dto.avatarUrl !== undefined
              ? { avatarUrl: dto.avatarUrl?.trim() || null }
              : {}),
            ...(dto.showPhone !== undefined ? { showPhone: dto.showPhone } : {}),
          },
        },
      },
      include: { profile: true },
    });

    return this.authService.mapUserToAccountDto(updatedUser);
  }

  async blockUser(
    blockerId: string,
    blockedId: string,
  ): Promise<{ blocked: boolean; targetUserId: string }> {
    if (blockerId === blockedId) {
      throw new BadRequestException('You cannot block your own account.');
    }

    const target = await this.prisma.user.findUnique({ where: { id: blockedId } });
    if (!target) {
      throw new NotFoundException('Target user not found.');
    }

    await this.prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
      update: {},
      create: {
        blockerId,
        blockedId,
      },
    });

    return { blocked: true, targetUserId: blockedId };
  }

  async unblockUser(
    blockerId: string,
    blockedId: string,
  ): Promise<{ blocked: boolean; targetUserId: string }> {
    await this.prisma.userBlock.deleteMany({
      where: {
        blockerId,
        blockedId,
      },
    });

    return { blocked: false, targetUserId: blockedId };
  }

  private async getBiDirectionalBlockedUserIds(viewerId: string): Promise<Set<string>> {
    const blocks = await this.prisma.userBlock.findMany({
      where: {
        OR: [{ blockerId: viewerId }, { blockedId: viewerId }],
      },
    });

    const ids = new Set<string>();
    for (const block of blocks) {
      ids.add(block.blockerId === viewerId ? block.blockedId : block.blockerId);
    }
    return ids;
  }

  private async getViewerBlockedUserIds(viewerId: string): Promise<Set<string>> {
    const blocks = await this.prisma.userBlock.findMany({
      where: { blockerId: viewerId },
    });
    return new Set(blocks.map((b) => b.blockedId));
  }

  public mapUserWithProfileToPublicSummary(user: {
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
  }): PublicUserSummary {
    if (!user.profile) {
      return {
        id: user.id,
        displayName: 'Rider',
        username: `rider_${user.id.slice(0, 6)}`,
        avatarUrl: null,
        bio: null,
        city: null,
        role: user.role as UserRole,
        canReceiveDirectMessage: user.allowDirectMessages !== DirectMessagePrivacy.NONE,
        publicPhoneNumber: null,
        isBlockedByViewer: false,
      };
    }

    return this.toPublicUserSummary(
      {
        ...user.profile,
        user: {
          role: user.role,
          phoneNumber: user.phoneNumber,
          allowDirectMessages: user.allowDirectMessages,
        },
      },
      false,
      false,
    );
  }

  private toPublicUserSummary(
    profile: {
      userId: string;
      displayName: string;
      username: string;
      avatarUrl: string | null;
      bio: string | null;
      city: string | null;
      showPhone: boolean;
      user: {
        role: string;
        phoneNumber: string | null;
        allowDirectMessages: string;
      };
    },
    isBlockedEitherWay: boolean,
    isBlockedByViewer: boolean,
  ): PublicUserSummary {
    const canReceiveDirectMessage =
      !isBlockedEitherWay &&
      profile.user.allowDirectMessages !== DirectMessagePrivacy.NONE;

    return {
      id: profile.userId,
      displayName: profile.displayName,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      city: profile.city,
      role: profile.user.role as UserRole,
      canReceiveDirectMessage,
      publicPhoneNumber:
        profile.showPhone && !isBlockedEitherWay ? profile.user.phoneNumber : null,
      isBlockedByViewer,
    };
  }
}

