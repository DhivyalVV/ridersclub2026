import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsProvider {
  sendOtp(phoneNumber: string, otpCode: string, expiresInMinutes: number): Promise<void>;
}

export const SMS_PROVIDER_TOKEN = 'SMS_PROVIDER_TOKEN';

@Injectable()
export class ConsoleDevSmsAdapter implements SmsProvider {
  private readonly logger = new Logger(ConsoleDevSmsAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async sendOtp(
    phoneNumber: string,
    otpCode: string,
    expiresInMinutes: number,
  ): Promise<void> {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const maskedPhone =
      phoneNumber.length > 4
        ? `${phoneNumber.slice(0, 3)}****${phoneNumber.slice(-3)}`
        : '***';

    if (nodeEnv !== 'production') {
      this.logger.log(
        `[DEV SMS ADAPTER] OTP for ${maskedPhone} is [${otpCode}] (valid for ${expiresInMinutes} mins)`,
      );
    } else {
      this.logger.log(`OTP dispatched to ${maskedPhone}`);
    }
  }
}

