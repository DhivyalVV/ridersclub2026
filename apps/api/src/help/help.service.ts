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
    viewerLat?: number;
    viewerLng?: number;
    radiusKm?: number;
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

    const items = records.map((record) =>
      this.mapHelpRequestToDto(record, {
        viewerId: params.viewerId,
        viewerLat: params.viewerLat,
        viewerLng: params.viewerLng,
      }),
    );

    if (
      typeof params.radiusKm === 'number' &&
      params.radiusKm > 0 &&
      typeof params.viewerLat === 'number' &&
      typeof params.viewerLng === 'number'
    ) {
      return items.filter(
        (item) =>
          item.distanceKmFromViewer === null ||
          item.distanceKmFromViewer <= params.radiusKm!,
      );
    }

    return items;
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
    // Strict location consent enforcement: never store or expose coordinates
    // unless locationConsentGranted === true.
    const consentGranted = Boolean(dto.locationConsentGranted);
    const latitude =
      consentGranted && typeof dto.latitude === 'number' ? dto.latitude : null;
    const longitude =
      consentGranted && typeof dto.longitude === 'number'
        ? dto.longitude
        : null;
    const locationLabel = consentGranted
      ? dto.locationLabel?.trim() ||
        (latitude !== null && longitude !== null
          ? `Shared GPS (${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E)`
          : 'General area shared (exact coordinates omitted)')
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
        latitude,
        longitude,
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
      viewerLat?: number;
      viewerLng?: number;
    },
  ): HelpRequestItem {
    const isClosed =
      record.status === HelpRequestStatus.RESOLVED ||
      record.status === HelpRequestStatus.CANCELLED;

    const showCoordinates =
      record.locationConsentGranted &&
      !isClosed &&
      record.latitude !== null &&
      record.longitude !== null;

    const latitude = showCoordinates ? record.latitude : null;
    const longitude = showCoordinates ? record.longitude : null;

    const externalMapUrl =
      latitude !== null && longitude !== null
        ? `https://www.openstreetmap.org/?mlat=${latitude.toFixed(5)}&mlon=${longitude.toFixed(5)}#map=15/${latitude.toFixed(5)}/${longitude.toFixed(5)}`
        : null;

    const distanceKmFromViewer =
      latitude !== null &&
      longitude !== null &&
      typeof options.viewerLat === 'number' &&
      typeof options.viewerLng === 'number'
        ? this.computeHaversineKm(
            options.viewerLat,
            options.viewerLng,
            latitude,
            longitude,
          )
        : null;

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
        ? record.locationLabel ||
          (latitude !== null && longitude !== null
            ? `Shared GPS (${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E)`
            : 'General area shared by rider')
        : 'Location hidden (Contact via 1:1 chat for exact spot)';

    return {
      id: record.id,
      category: record.category as HelpCategory,
      description: record.description,
      vehicleSummary: record.vehicleSummary,
      status: record.status as HelpRequestStatus,
      locationSharedWithConsent: record.locationConsentGranted && !isClosed,
      locationLabel,
      latitude,
      longitude,
      externalMapUrl,
      distanceKmFromViewer,
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

  private computeHaversineKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const toRad = (deg: number): number => (deg * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(earthRadiusKm * c * 10) / 10;
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
          locationLabel: 'NH-48 Tumakuru Bypass (13.3409° N, 77.1010° E)',
          latitude: 13.3409,
          longitude: 77.101,
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

