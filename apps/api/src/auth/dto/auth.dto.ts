import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class PasswordSignUpDto {
  @ApiProperty({
    example: 'aarav_rides',
    description: 'Unique rider handle (3-24 characters, letters, numbers, underscores)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Username must be at least 3 characters long.' })
  @MaxLength(24, { message: 'Username cannot exceed 24 characters.' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores.',
  })
  username!: string;

  @ApiProperty({
    example: 'StrongRiderPass123!',
    description: 'Account password (minimum 6 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({
    example: 'Aarav Sharma',
    description: 'Public display name on RidersClub',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  displayName?: string;

  @ApiPropertyOptional({
    example: 'aarav@ridersclub.dev',
    description: 'Optional email address for account recovery and Google linking',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email?: string;
}

export class PasswordSignInDto {
  @ApiProperty({
    example: 'aarav_rides',
    description: 'Username (@handle) or email address',
  })
  @IsString()
  @IsNotEmpty({ message: 'Please enter your username or email.' })
  @MaxLength(120)
  identifier!: string;

  @ApiProperty({
    example: 'StrongRiderPass123!',
    description: 'Account password',
  })
  @IsString()
  @IsNotEmpty({ message: 'Please enter your password.' })
  @MaxLength(128)
  password!: string;
}

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
  phoneNumber!: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+919845012345' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{9,14}$/, {
    message: 'Phone number must be a valid 10 to 15 digit phone number.',
  })
  phoneNumber!: string;

  @ApiProperty({ example: '123456', description: '6-digit numeric OTP code' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'OTP code must be a 6-digit number.' })
  code!: string;

  @ApiPropertyOptional({ example: 'Aarav Sharma' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  displayName?: string;
}

export class GoogleSignInDto {
  @ApiPropertyOptional({
    description: 'Google OAuth 2.0 ID token (JWT credential) returned by Google Identity Services popup',
  })
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  googleIdToken?: string;

  @ApiPropertyOptional({
    description: 'Google OAuth 2.0 Access Token returned by Google account chooser popup',
  })
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  googleAccessToken?: string;

  @ApiPropertyOptional({
    example: 'google-oauth-sub-10928374',
    description: 'Verified Google Subject ID (used in automated test suites)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  googleSubjectId?: string;

  @ApiPropertyOptional({ example: 'rider@ridersclub.dev' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Aarav Sharma' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  displayName?: string;

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
  phoneNumber!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code!: string;
}
