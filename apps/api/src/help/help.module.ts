import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { HelpController } from './help.controller';
import { HelpService } from './help.service';

@Module({
  imports: [AuthModule, ProfilesModule],
  controllers: [HelpController],
  providers: [HelpService],
  exports: [HelpService],
})
export class HelpModule {}

