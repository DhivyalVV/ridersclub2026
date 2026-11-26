import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { NewsModule } from './news/news.module';
import { CommunitiesModule } from './communities/communities.module';
import { MessagingModule } from './messaging/messaging.module';
import { ProfilesModule } from './profiles/profiles.module';
import { RidesModule } from './rides/rides.module';
import { HelpModule } from './help/help.module';
import { MechanicsModule } from './mechanics/mechanics.module';
import { GarageModule } from './garage/garage.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { AdminModule } from './admin/admin.module';
import { SeoModule } from './seo/seo.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    PrismaModule,
    AuthModule,
    ProfilesModule,
    NewsModule,
    CommunitiesModule,
    MessagingModule,
    RidesModule,
    HelpModule,
    MechanicsModule,
    GarageModule,
    MarketplaceModule,
    AdminModule,
    HealthModule,
    SeoModule,
  ],
})
export class AppModule {}
