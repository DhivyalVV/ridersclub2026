import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
  RolesGuard,
} from './guards/jwt-auth.guard';
import { ConsoleDevSmsAdapter, SMS_PROVIDER_TOKEN } from './sms.provider';
import { TokenService } from './token.service';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    TokenService,
    AuthService,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    RolesGuard,
    {
      provide: SMS_PROVIDER_TOKEN,
      useClass: ConsoleDevSmsAdapter,
    },
  ],
  exports: [
    TokenService,
    AuthService,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}

