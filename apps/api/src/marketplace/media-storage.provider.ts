import { BadRequestException, Injectable } from '@nestjs/common';
import type { ListingPhotoUploadInput } from '@ridersclub/types';

export const MEDIA_STORAGE_PROVIDER_TOKEN = 'MEDIA_STORAGE_PROVIDER_TOKEN';

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_LISTING_PHOTOS = 6;

export interface StoredListingPhoto {
  url: string;
  mimeType: string;
  sizeBytes: number;
  displayOrder: number;
}

export interface MediaStorageProvider {
  validateAndStoreListingPhotos(
    inputs?: ListingPhotoUploadInput[],
  ): StoredListingPhoto[];
}

@Injectable()
export class LocalOrS3MediaStorageAdapter implements MediaStorageProvider {
  validateAndStoreListingPhotos(
    inputs?: ListingPhotoUploadInput[],
  ): StoredListingPhoto[] {
    if (!inputs || inputs.length === 0) {
      return [];
    }

    if (inputs.length > MAX_LISTING_PHOTOS) {
      throw new BadRequestException(
        `A marketplace listing can include at most ${MAX_LISTING_PHOTOS} photos.`,
      );
    }

    return inputs.map((item, idx) => {
      const normalizedMime = item.mimeType?.trim().toLowerCase() ?? '';
      if (
        !ALLOWED_IMAGE_MIME_TYPES.includes(
          normalizedMime as (typeof ALLOWED_IMAGE_MIME_TYPES)[number],
        )
      ) {
        throw new BadRequestException(
          `Unsupported image MIME type "${item.mimeType}". Allowed formats: JPEG, PNG, WebP.`,
        );
      }

      if (
        typeof item.sizeBytes !== 'number' ||
        Number.isNaN(item.sizeBytes) ||
        item.sizeBytes <= 0
      ) {
        throw new BadRequestException('Photo sizeBytes must be greater than 0.');
      }

      if (item.sizeBytes > MAX_IMAGE_SIZE_BYTES) {
        throw new BadRequestException(
          `Photo "${item.fileName}" exceeds the maximum allowed size of 5 MB.`,
        );
      }

      const safeFileName =
        item.fileName
          ?.trim()
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .slice(0, 80) || `photo-${idx + 1}.jpg`;

      const url =
        item.dataUrl &&
        (item.dataUrl.startsWith('data:image/') ||
          item.dataUrl.startsWith('https://'))
          ? item.dataUrl
          : `/uploads/marketplace/${Date.now()}-${idx}-${safeFileName}`;

      return {
        url,
        mimeType: normalizedMime,
        sizeBytes: Math.round(item.sizeBytes),
        displayOrder: idx,
      };
    });
  }
}

