import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { MessagingRealtimeService } from './messaging-realtime.service';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';

@Module({
  imports: [AuthModule, ProfilesModule],
  controllers: [MessagingController],
  providers: [MessagingService, MessagingRealtimeService],
  exports: [MessagingService, MessagingRealtimeService],
})
export class MessagingModule {}

