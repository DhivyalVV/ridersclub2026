import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({
    example: '+919845012345',
    description: 'Phone number in E.164 or 10-15 digit format',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{9,14}$/, {
    message: 'Phone number must be a valid 10 to 15 digit phone number (e.g., +919845012345).',
  })
  phoneNumber: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+919845012345' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{9,14}$/, {
    message: 'Phone number must be a valid 10 to 15 digit phone number.',
  })
  phoneNumber: string;

  @ApiProperty({ example: '123456', description: '6-digit numeric OTP code' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'OTP code must be a 6-digit number.' })
  code: string;

  @ApiPropertyOptional({ example: 'Aarav Sharma' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  displayName?: string;
}

export class GoogleSignInDto {
  @ApiProperty({
    example: 'google-oauth-sub-10928374',
    description: 'Verified Google Subject ID or OAuth token identifier',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  googleSubjectId: string;

  @ApiProperty({ example: 'rider@ridersclub.dev' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Aarav Sharma' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  displayName: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-avatar' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;
}

export class LinkPhoneDto {
  @ApiProperty({ example: '+919845012345' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{9,14}$/)
  phoneNumber: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code: string;
}

