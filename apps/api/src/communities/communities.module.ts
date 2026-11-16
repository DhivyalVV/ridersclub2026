import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { CommunitiesController } from './communities.controller';
import { CommunitiesService } from './communities.service';

@Module({
  imports: [AuthModule, ProfilesModule],
  controllers: [CommunitiesController],
  providers: [CommunitiesService],
  exports: [CommunitiesService],
})
export class CommunitiesModule {}

