import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import {
  LocalOrS3MediaStorageAdapter,
  MEDIA_STORAGE_PROVIDER_TOKEN,
} from './media-storage.provider';

@Module({
  imports: [AuthModule, ProfilesModule],
  controllers: [MarketplaceController],
  providers: [
    MarketplaceService,
    {
      provide: MEDIA_STORAGE_PROVIDER_TOKEN,
      useClass: LocalOrS3MediaStorageAdapter,
    },
  ],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}

