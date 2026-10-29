import { Module } from '@nestjs/common';
import { ProfilesModule } from '../profiles/profiles.module';
import { RidesController } from './rides.controller';
import { RidesService } from './rides.service';
import {
  OpenStreetMapRouteAdapter,
  ROUTE_MAP_PROVIDER_TOKEN,
} from './route-map.provider';

@Module({
  imports: [ProfilesModule],
  controllers: [RidesController],
  providers: [
    RidesService,
    {
      provide: ROUTE_MAP_PROVIDER_TOKEN,
      useClass: OpenStreetMapRouteAdapter,
    },
  ],
  exports: [RidesService],
})
export class RidesModule {}

