import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DirectMessagePrivacy,
  ListingStatus,
  UserRole,
  VehicleType,
  type ListingPhotoItem,
  type ListingSortOption,
  type MarketplaceListingItem,
} from '@ridersclub/types';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import {
  CreateMarketplaceListingDto,
  UpdateMarketplaceListingDto,
} from './dto/marketplace.dto';
import {
  MEDIA_STORAGE_PROVIDER_TOKEN,
  type MediaStorageProvider,
} from './media-storage.provider';

interface ListingRecordWithRelations {
  id: string;
  sellerId: string;
  vehicleType: string;
  make: string;
  model: string;
  year: number;
  odometerKm: number;
  askingPriceInr: number;
  description: string;
  location: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  seller: {
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
  photos: Array<{
    id: string;
    listingId: string;
    url: string;
    mimeType: string;
    sizeBytes: number;
    displayOrder: number;
  }>;
}

@Injectable()
export class MarketplaceService {
  private seededCheckComplete = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
    @Inject(MEDIA_STORAGE_PROVIDER_TOKEN)
    private readonly mediaStorageProvider: MediaStorageProvider,
  ) {}

  async listListings(params: {
    vehicleType?: VehicleType;
    status?: ListingStatus;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: ListingSortOption;
  }): Promise<MarketplaceListingItem[]> {
    await this.ensureInitialListingsSeeded();

    const search = params.search?.trim();
    const orderBy =
      params.sort === 'PRICE_ASC'
        ? ({ askingPriceInr: 'asc' } as const)
        : params.sort === 'PRICE_DESC'
          ? ({ askingPriceInr: 'desc' } as const)
          : ({ createdAt: 'desc' } as const);

    const records = await this.prisma.marketplaceListing.findMany({
      where: {
        ...(params.vehicleType ? { vehicleType: params.vehicleType } : {}),
        ...(params.status ? { status: params.status } : {}),
        ...(typeof params.minPrice === 'number' ||
        typeof params.maxPrice === 'number'
          ? {
              askingPriceInr: {
                ...(typeof params.minPrice === 'number'
                  ? { gte: params.minPrice }
                  : {}),
                ...(typeof params.maxPrice === 'number'
                  ? { lte: params.maxPrice }
                  : {}),
              },
            }
          : {}),
        ...(search
          ? {
              OR: [
                { make: { contains: search, mode: 'insensitive' } },
                { model: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { location: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        seller: { include: { profile: true } },
        photos: { orderBy: { displayOrder: 'asc' } },
      },
      orderBy,
    });

    return records.map((rec) => this.mapListingToDto(rec));
  }

  async getListingById(listingId: string): Promise<MarketplaceListingItem> {
    await this.ensureInitialListingsSeeded();

    const record = await this.prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      include: {
        seller: { include: { profile: true } },
        photos: { orderBy: { displayOrder: 'asc' } },
      },
    });

    if (!record) {
      throw new NotFoundException('Marketplace listing not found.');
    }

    return this.mapListingToDto(record);
  }

  async createListing(
    sellerId: string,
    dto: CreateMarketplaceListingDto,
  ): Promise<MarketplaceListingItem> {
    if (dto.askingPriceInr <= 0) {
      throw new BadRequestException('Asking price must be greater than zero.');
    }
    if (dto.odometerKm < 0) {
      throw new BadRequestException('Odometer reading cannot be negative.');
    }

    const validatedPhotos =
      this.mediaStorageProvider.validateAndStoreListingPhotos(dto.photos);

    const created = await this.prisma.marketplaceListing.create({
      data: {
        sellerId,
        vehicleType: dto.vehicleType,
        make: dto.make.trim(),
        model: dto.model.trim(),
        year: dto.year,
        odometerKm: dto.odometerKm,
        askingPriceInr: dto.askingPriceInr,
        description: dto.description.trim(),
        location: dto.location.trim(),
        status: ListingStatus.ACTIVE,
        photos: {
          create: validatedPhotos.map((p) => ({
            url: p.url,
            mimeType: p.mimeType,
            sizeBytes: p.sizeBytes,
            displayOrder: p.displayOrder,
          })),
        },
      },
      include: {
        seller: { include: { profile: true } },
        photos: { orderBy: { displayOrder: 'asc' } },
      },
    });

    return this.mapListingToDto(created);
  }

  async updateListing(
    listingId: string,
    actorId: string,
    actorRole: UserRole,
    dto: UpdateMarketplaceListingDto,
  ): Promise<MarketplaceListingItem> {
    const existing = await this.prisma.marketplaceListing.findUnique({
      where: { id: listingId },
    });

    if (!existing) {
      throw new NotFoundException('Marketplace listing not found.');
    }

    const isModOrAdmin =
      actorRole === UserRole.ADMIN || actorRole === UserRole.MODERATOR;
    if (existing.sellerId !== actorId && !isModOrAdmin) {
      throw new ForbiddenException(
        'Only the listing seller or a moderator/admin can modify this listing.',
      );
    }

    if (dto.askingPriceInr !== undefined && dto.askingPriceInr <= 0) {
      throw new BadRequestException('Asking price must be greater than zero.');
    }

    const updated = await this.prisma.marketplaceListing.update({
      where: { id: listingId },
      data: {
        ...(dto.make !== undefined ? { make: dto.make.trim() } : {}),
        ...(dto.model !== undefined ? { model: dto.model.trim() } : {}),
        ...(dto.year !== undefined ? { year: dto.year } : {}),
        ...(dto.odometerKm !== undefined ? { odometerKm: dto.odometerKm } : {}),
        ...(dto.askingPriceInr !== undefined
          ? { askingPriceInr: dto.askingPriceInr }
          : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() }
          : {}),
        ...(dto.location !== undefined
          ? { location: dto.location.trim() }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      include: {
        seller: { include: { profile: true } },
        photos: { orderBy: { displayOrder: 'asc' } },
      },
    });

    return this.mapListingToDto(updated);
  }

  private mapListingToDto(
    record: ListingRecordWithRelations,
  ): MarketplaceListingItem {
    const photos: ListingPhotoItem[] = record.photos.map((p) => ({
      id: p.id,
      listingId: p.listingId,
      url: p.url,
      mimeType: p.mimeType,
      sizeBytes: p.sizeBytes,
      displayOrder: p.displayOrder,
    }));

    return {
      id: record.id,
      sellerId: record.sellerId,
      vehicleType: record.vehicleType as VehicleType,
      make: record.make,
      model: record.model,
      year: record.year,
      odometerKm: record.odometerKm,
      askingPriceInr: record.askingPriceInr,
      description: record.description,
      location: record.location,
      status: record.status as ListingStatus,
      photos,
      seller: this.profilesService.mapUserWithProfileToPublicSummary(
        record.seller,
      ),
      createdAt: record.createdAt.toISOString(),
    };
  }

  private async ensureInitialListingsSeeded(): Promise<void> {
    if (this.seededCheckComplete) {
      return;
    }
    this.seededCheckComplete = true;

    try {
      const count = await this.prisma.marketplaceListing.count();
      if (count > 0) {
        return;
      }

      const seller1 = await this.prisma.user.upsert({
        where: { email: 'nikhil.triple@ridersclub.example' },
        update: {},
        create: {
          email: 'nikhil.triple@ridersclub.example',
          role: UserRole.USER,
          allowDirectMessages: DirectMessagePrivacy.EVERYONE,
          profile: {
            create: {
              username: 'nikhil_triple',
              displayName: 'Nikhil Raj',
              bio: 'Weekend canyon rider • upgrading to Daytona',
              city: 'Bengaluru',
            },
          },
        },
      });

      const seller2 = await this.prisma.user.upsert({
        where: { email: 'devika.gttsi@ridersclub.example' },
        update: {},
        create: {
          email: 'devika.gttsi@ridersclub.example',
          role: UserRole.USER,
          allowDirectMessages: DirectMessagePrivacy.EVERYONE,
          profile: {
            create: {
              username: 'devika_gttsi',
              displayName: 'Devika Reddy',
              bio: 'Autocross participant & daily driver enthusiast',
              city: 'Hyderabad',
            },
          },
        },
      });

      await this.prisma.marketplaceListing.create({
        data: {
          sellerId: seller1.id,
          vehicleType: VehicleType.MOTORCYCLE,
          make: 'Triumph',
          model: 'Street Triple 765 R',
          year: 2023,
          odometerKm: 6400,
          askingPriceInr: 895000,
          description:
            'Single owner, 6,400 km on odometer, full dealership service history, frame sliders and radiator guard installed.',
          location: 'Koramangala, Bengaluru',
          status: ListingStatus.ACTIVE,
          photos: {
            create: [
              {
                url: '/uploads/marketplace/seed-street-triple-765r.jpg',
                mimeType: 'image/jpeg',
                sizeBytes: 1240000,
                displayOrder: 0,
              },
            ],
          },
        },
      });

      await this.prisma.marketplaceListing.create({
        data: {
          sellerId: seller2.id,
          vehicleType: VehicleType.CAR,
          make: 'Volkswagen',
          model: 'Polo GT TSI 1.0 (Manual Conversion)',
          year: 2021,
          odometerKm: 31200,
          askingPriceInr: 780000,
          description:
            'Enthusiast-owned hatchback, 31,200 km, Bilstein B6 dampers, stock engine map, comprehensive insurance valid till March.',
          location: 'Banjara Hills, Hyderabad',
          status: ListingStatus.ACTIVE,
          photos: {
            create: [
              {
                url: '/uploads/marketplace/seed-polo-gt-tsi.jpg',
                mimeType: 'image/jpeg',
                sizeBytes: 1480000,
                displayOrder: 0,
              },
            ],
          },
        },
      });
    } catch {
      // Ignore seed race conditions
    }
  }
}

