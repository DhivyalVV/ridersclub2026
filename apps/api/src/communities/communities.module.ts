import { Module } from '@nestjs/common';
import { ProfilesModule } from '../profiles/profiles.module';
import { CommunitiesController } from './communities.controller';
import { CommunitiesService } from './communities.service';

@Module({
  imports: [ProfilesModule],
  controllers: [CommunitiesController],
  providers: [CommunitiesService],
  exports: [CommunitiesService],
})
export class CommunitiesModule {}

