import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { MechanicsController } from './mechanics.controller';
import { MechanicsService } from './mechanics.service';

@Module({
  imports: [AuthModule, ProfilesModule],
  controllers: [MechanicsController],
  providers: [MechanicsService],
  exports: [MechanicsService],
})
export class MechanicsModule {}

