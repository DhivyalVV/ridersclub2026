import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  ListingStatus,
  UserRole,
  VehicleType,
  type PublicUserSummary,
} from '@ridersclub/types';
import { MarketplaceService } from './marketplace.service';
import { LocalOrS3MediaStorageAdapter } from './media-storage.provider';

describe('MarketplaceService & LocalOrS3MediaStorageAdapter (Phase 12)', () => {
  const mockSellerSummary: PublicUserSummary = {
    id: 'user-seller-1',
    displayName: 'Nikhil Raj',
    username: 'nikhil_triple',
    avatarUrl: null,
    bio: 'Weekend canyon rider',
    city: 'Bengaluru',
    role: UserRole.USER,
    canReceiveDirectMessage: true,
  };

  const mockProfilesService = {
    mapUserWithProfileToPublicSummary: jest.fn(() => mockSellerSummary),
  };

  const mediaStorage = new LocalOrS3MediaStorageAdapter();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects unsupported MIME types or oversized files (> 5 MB) in LocalOrS3MediaStorageAdapter', () => {
    expect(() =>
      mediaStorage.validateAndStoreListingPhotos([
        {
          fileName: 'exploit.exe',
          mimeType: 'application/x-msdownload',
          sizeBytes: 25000,
        },
      ]),
    ).toThrow(BadRequestException);

    expect(() =>
      mediaStorage.validateAndStoreListingPhotos([
        {
          fileName: 'huge-raw.png',
          mimeType: 'image/png',
          sizeBytes: 6 * 1024 * 1024,
        },
      ]),
    ).toThrow(BadRequestException);
  });

  it('creates a listing with validated JPEG/WebP photos', async () => {
    const createMock = jest.fn().mockImplementation(async ({ data }) => ({
      id: 'list-new-1',
      sellerId: data.sellerId,
      vehicleType: data.vehicleType,
      make: data.make,
      model: data.model,
      year: data.year,
      odometerKm: data.odometerKm,
      askingPriceInr: data.askingPriceInr,
      description: data.description,
      location: data.location,
      status: data.status,
      createdAt: new Date('2026-10-22T12:00:00.000Z'),
      updatedAt: new Date('2026-10-22T12:00:00.000Z'),
      seller: { id: 'user-seller-1', profile: null },
      photos: (data.photos?.create ?? []).map(
        (p: Record<string, unknown>, idx: number) => ({
          id: `photo-${idx}`,
          listingId: 'list-new-1',
          ...p,
        }),
      ),
    }));

    const mockPrisma = {
      marketplaceListing: {
        create: createMock,
      },
    };

    const service = new MarketplaceService(
      mockPrisma as never,
      mockProfilesService as never,
      mediaStorage,
    );

    const created = await service.createListing('user-seller-1', {
      vehicleType: VehicleType.MOTORCYCLE,
      make: 'Kawasaki',
      model: 'Ninja ZX-6R',
      year: 2024,
      odometerKm: 3200,
      askingPriceInr: 1090000,
      description: 'Immaculate KRT edition, showroom condition.',
      location: 'Indiranagar, Bengaluru',
      photos: [
        {
          fileName: 'zx6r-side.webp',
          mimeType: 'image/webp',
          sizeBytes: 820000,
        },
      ],
    });

    expect(created.make).toBe('Kawasaki');
    expect(created.photos).toHaveLength(1);
    expect(created.photos[0]?.mimeType).toBe('image/webp');
  });

  it('enforces seller or moderator/admin ownership on updateListing', async () => {
    const mockPrisma = {
      marketplaceListing: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'list-1',
          sellerId: 'user-seller-1',
          status: ListingStatus.ACTIVE,
        }),
      },
    };

    const service = new MarketplaceService(
      mockPrisma as never,
      mockProfilesService as never,
      mediaStorage,
    );

    await expect(
      service.updateListing('list-1', 'intruder-user-2', UserRole.USER, {
        status: ListingStatus.SOLD,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows the seller to mark their listing as SOLD', async () => {
    const updateMock = jest.fn().mockImplementation(async ({ data }) => ({
      id: 'list-1',
      sellerId: 'user-seller-1',
      vehicleType: VehicleType.MOTORCYCLE,
      make: 'Triumph',
      model: 'Street Triple 765 R',
      year: 2023,
      odometerKm: 6400,
      askingPriceInr: 895000,
      description: 'Single owner',
      location: 'Bengaluru',
      status: data.status,
      createdAt: new Date(),
      updatedAt: new Date(),
      seller: { id: 'user-seller-1', profile: null },
      photos: [],
    }));

    const mockPrisma = {
      marketplaceListing: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'list-1',
          sellerId: 'user-seller-1',
          status: ListingStatus.ACTIVE,
        }),
        update: updateMock,
      },
    };

    const service = new MarketplaceService(
      mockPrisma as never,
      mockProfilesService as never,
      mediaStorage,
    );

    const updated = await service.updateListing(
      'list-1',
      'user-seller-1',
      UserRole.USER,
      { status: ListingStatus.SOLD },
    );

    expect(updated.status).toBe(ListingStatus.SOLD);
  });

  it('passes price sorting order to Prisma findMany in listListings', async () => {
    const findManyMock = jest.fn().mockResolvedValue([]);
    const mockPrisma = {
      marketplaceListing: {
        count: jest.fn().mockResolvedValue(2),
        findMany: findManyMock,
      },
    };

    const service = new MarketplaceService(
      mockPrisma as never,
      mockProfilesService as never,
      mediaStorage,
    );

    await service.listListings({
      vehicleType: VehicleType.CAR,
      sort: 'PRICE_ASC',
    });

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          vehicleType: VehicleType.CAR,
        }),
        orderBy: { askingPriceInr: 'asc' },
      }),
    );
  });
});

