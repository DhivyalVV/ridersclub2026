import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DirectMessagePrivacy,
  HelpCategory,
  HelpRequestStatus,
  UserRole,
  type HelpRequestItem,
  type HelpRequestOfferItem,
} from '@ridersclub/types';
import type { JwtAccessPayload } from '../auth/token.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import {
  CreateHelpRequestDto,
  OfferHelpDto,
  UpdateHelpStatusDto,
} from './dto/help.dto';

interface HelpRequestRecordWithRelations {
  id: string;
  requesterId: string;
  category: string;
  description: string;
  vehicleSummary: string | null;
  status: string;
  locationConsentGranted: boolean;
  locationLabel: string | null;
  latitude: number | null;
  longitude: number | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  requester: {
    id: string;
    role: string;
    phoneNumber: string | null;
    allowDirectMessages: string;
    profile: {
      userId: string;
      username: string;
      displayName: string;
      bio: string | null;
      avatarUrl: string | null;
      city: string | null;
      showPhone: boolean;
    } | null;
  };
  offers: Array<{
    id: string;
    helpRequestId: string;
    helperId: string;
    note: string | null;
    createdAt: Date;
    helper?: {
      id: string;
      role: string;
      phoneNumber: string | null;
      allowDirectMessages: string;
      profile: {
        userId: string;
        username: string;
        displayName: string;
        bio: string | null;
        avatarUrl: string | null;
        city: string | null;
        showPhone: boolean;
      } | null;
    };
  }>;
}

@Injectable()
export class HelpService {
  private seededCheckComplete = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
  ) {}

  async listHelpRequests(params: {
    status?: HelpRequestStatus;
    category?: HelpCategory;
    search?: string;
    viewerId?: string;
  }): Promise<HelpRequestItem[]> {
    await this.ensureInitialHelpRequestsSeeded();

    const search = params.search?.trim();

    const records = await this.prisma.helpRequest.findMany({
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.category ? { category: params.category } : {}),
        ...(search
          ? {
              OR: [
                { description: { contains: search, mode: 'insensitive' } },
                { vehicleSummary: { contains: search, mode: 'insensitive' } },
                { locationLabel: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        requester: { include: { profile: true } },
        offers: {
          include: {
            helper: { include: { profile: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) =>
      this.mapHelpRequestToDto(record, {
        viewerId: params.viewerId,
      }),
    );
  }

  async getHelpRequestById(
    helpRequestId: string,
    viewerId?: string,
  ): Promise<HelpRequestItem> {
    await this.ensureInitialHelpRequestsSeeded();

    const record = await this.prisma.helpRequest.findUnique({
      where: { id: helpRequestId },
      include: {
        requester: { include: { profile: true } },
        offers: {
          include: {
            helper: { include: { profile: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Help request not found.');
    }

    return this.mapHelpRequestToDto(record, { viewerId });
  }

  async createHelpRequest(
    requesterId: string,
    dto: CreateHelpRequestDto,
  ): Promise<HelpRequestItem> {
    // Strict location consent enforcement: never store or expose location
    // unless locationConsentGranted === true.
    const consentGranted = Boolean(dto.locationConsentGranted);
    const locationLabel = consentGranted
      ? dto.locationLabel?.trim() || 'Current city / landmark shared by rider'
      : 'Location hidden (Contact via 1:1 chat for exact spot)';

    const created = await this.prisma.helpRequest.create({
      data: {
        requesterId,
        category: dto.category,
        description: dto.description.trim(),
        vehicleSummary: dto.vehicleSummary?.trim() || null,
        status: HelpRequestStatus.OPEN,
        locationConsentGranted: consentGranted,
        locationLabel,
        latitude: null,
        longitude: null,
      },
      include: {
        requester: { include: { profile: true } },
        offers: {
          include: {
            helper: { include: { profile: true } },
          },
        },
      },
    });

    return this.mapHelpRequestToDto(created, { viewerId: requesterId });
  }

  async offerAssistance(
    helpRequestId: string,
    helperId: string,
    dto: OfferHelpDto,
  ): Promise<HelpRequestItem> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.helpRequest.findUnique({
        where: { id: helpRequestId },
      });

      if (!existing) {
        throw new NotFoundException('Help request not found.');
      }

      if (existing.requesterId === helperId) {
        throw new BadRequestException(
          'You cannot offer assistance on your own help request.',
        );
      }

      if (
        existing.status === HelpRequestStatus.RESOLVED ||
        existing.status === HelpRequestStatus.CANCELLED
      ) {
        throw new BadRequestException(
          'Cannot offer assistance on a resolved or cancelled help request.',
        );
      }

      await tx.helpRequestOffer.upsert({
        where: {
          helpRequestId_helperId: {
            helpRequestId,
            helperId,
          },
        },
        update: {
          note: dto.note?.trim() || null,
        },
        create: {
          helpRequestId,
          helperId,
          note: dto.note?.trim() || null,
        },
      });

      return tx.helpRequest.update({
        where: { id: helpRequestId },
        data: {
          status: HelpRequestStatus.ASSISTANCE_OFFERED,
        },
        include: {
          requester: { include: { profile: true } },
          offers: {
            include: {
              helper: { include: { profile: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    });

    return this.mapHelpRequestToDto(updated, { viewerId: helperId });
  }

  async updateStatus(
    helpRequestId: string,
    actor: JwtAccessPayload,
    dto: UpdateHelpStatusDto,
  ): Promise<HelpRequestItem> {
    const existing = await this.prisma.helpRequest.findUnique({
      where: { id: helpRequestId },
    });

    if (!existing) {
      throw new NotFoundException('Help request not found.');
    }

    const isModeratorOrAdmin =
      actor.role === UserRole.ADMIN || actor.role === UserRole.MODERATOR;
    if (existing.requesterId !== actor.sub && !isModeratorOrAdmin) {
      throw new ForbiddenException(
        'Only the requester or a moderator/admin can update this help request status.',
      );
    }

    const isClosing =
      dto.status === HelpRequestStatus.RESOLVED ||
      dto.status === HelpRequestStatus.CANCELLED;

    // Privacy cleanup: automatically redact stored GPS coordinates when a request
    // transitions to RESOLVED or CANCELLED so sensitive roadside locations are not retained.
    const updated = await this.prisma.helpRequest.update({
      where: { id: helpRequestId },
      data: {
        status: dto.status,
        ...(isClosing
          ? {
              locationConsentGranted: false,
              latitude: null,
              longitude: null,
              locationLabel: 'Location auto-redacted after request closure',
              resolvedAt:
                dto.status === HelpRequestStatus.RESOLVED
                  ? new Date()
                  : existing.resolvedAt,
            }
          : {}),
      },
      include: {
        requester: { include: { profile: true } },
        offers: {
          include: {
            helper: { include: { profile: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return this.mapHelpRequestToDto(updated, { viewerId: actor.sub });
  }

  private mapHelpRequestToDto(
    record: HelpRequestRecordWithRelations,
    options: {
      viewerId?: string;
    },
  ): HelpRequestItem {
    const isClosed =
      record.status === HelpRequestStatus.RESOLVED ||
      record.status === HelpRequestStatus.CANCELLED;

    const offers: HelpRequestOfferItem[] = record.offers.map((offer) => ({
      id: offer.id,
      helpRequestId: offer.helpRequestId,
      helperId: offer.helperId,
      note: offer.note,
      createdAt: offer.createdAt.toISOString(),
      helper: offer.helper
        ? this.profilesService.mapUserWithProfileToPublicSummary(offer.helper)
        : {
            id: offer.helperId,
            displayName: 'Rider Helper',
            username: 'rider_helper',
            avatarUrl: null,
            bio: null,
            city: null,
            role: UserRole.USER,
            canReceiveDirectMessage: true,
          },
    }));

    const isOfferedByViewer = options.viewerId
      ? record.offers.some((o) => o.helperId === options.viewerId)
      : false;

    const locationLabel = isClosed
      ? 'Location auto-redacted after request closure'
      : record.locationConsentGranted
        ? record.locationLabel || 'Current city / landmark shared by rider'
        : 'Location hidden (Contact via 1:1 chat for exact spot)';

    return {
      id: record.id,
      category: record.category as HelpCategory,
      description: record.description,
      vehicleSummary: record.vehicleSummary,
      status: record.status as HelpRequestStatus,
      locationSharedWithConsent: record.locationConsentGranted && !isClosed,
      locationLabel,
      requester: this.profilesService.mapUserWithProfileToPublicSummary(
        record.requester,
      ),
      offersCount: offers.length,
      offers,
      isOfferedByViewer,
      createdAt: record.createdAt.toISOString(),
      createdAtLabel: this.formatRelativeTime(record.createdAt),
      resolvedAt: record.resolvedAt ? record.resolvedAt.toISOString() : null,
    };
  }

  private formatRelativeTime(date: Date): string {
    const diffMs = Math.max(0, Date.now() - date.getTime());
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) {
      return 'Just now';
    }
    if (diffMins < 60) {
      return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    }
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }

  private async ensureInitialHelpRequestsSeeded(): Promise<void> {
    if (this.seededCheckComplete) {
      return;
    }
    this.seededCheckComplete = true;

    try {
      const count = await this.prisma.helpRequest.count();
      if (count > 0) {
        return;
      }

      const requester1 = await this.prisma.user.upsert({
        where: { email: 'karthik.xpulse@ridersclub.example' },
        update: {},
        create: {
          email: 'karthik.xpulse@ridersclub.example',
          role: UserRole.USER,
          allowDirectMessages: DirectMessagePrivacy.EVERYONE,
          profile: {
            create: {
              username: 'karthik_xpulse',
              displayName: 'Karthik Nair',
              bio: 'XPulse 200 4V • Weekend trail rider',
              city: 'Bengaluru',
            },
          },
        },
      });

      const requester2 = await this.prisma.user.upsert({
        where: { email: 'priya.octavia@ridersclub.example' },
        update: {},
        create: {
          email: 'priya.octavia@ridersclub.example',
          role: UserRole.USER,
          allowDirectMessages: DirectMessagePrivacy.EVERYONE,
          profile: {
            create: {
              username: 'priya_octavia',
              displayName: 'Priya Menon',
              bio: 'Highway tourer • Octavia TDI',
              city: 'Mysuru',
            },
          },
        },
      });

      await this.prisma.helpRequest.create({
        data: {
          requesterId: requester1.id,
          category: HelpCategory.FLAT_TIRE,
          description:
            'Rear tube puncture on NH-48 near Tumakuru bypass. Have spare tube and tire irons, need a portable air inflator or 17mm axle wrench.',
          vehicleSummary: 'Hero XPulse 200 4V (Rally Edition)',
          status: HelpRequestStatus.OPEN,
          locationConsentGranted: true,
          locationLabel: 'Bengaluru • NH-48 Tumakuru Bypass',
          latitude: null,
          longitude: null,
        },
      });

      await this.prisma.helpRequest.create({
        data: {
          requesterId: requester2.id,
          category: HelpCategory.BATTERY_JUMP,
          description:
            'Alternator warning light came on and battery drained at highway rest stop. Need jumper cables from a car or portable jump pack.',
          vehicleSummary: 'Skoda Octavia 2.0 TDI (Race Blue)',
          status: HelpRequestStatus.ASSISTANCE_OFFERED,
          locationConsentGranted: false,
          locationLabel: 'Location hidden (Contact via 1:1 chat for exact spot)',
          latitude: null,
          longitude: null,
          offers: {
            create: {
              helperId: requester1.id,
              note: 'Carrying a NOCO Boost jump pack, reaching Mysuru road stop in 15 mins.',
            },
          },
        },
      });
    } catch {
      // Ignore seed race conditions
    }
  }
}

