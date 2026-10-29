import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MechanicVerificationStatus } from '@ridersclub/types';

export class RegisterMechanicDto {
  @ApiProperty({ example: 'Apex MotoWorks & Suspension Lab' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(120)
  businessName!: string;

  @ApiProperty({
    example:
      'Specialized multi-brand motorcycle & performance car workshop offering suspension setup, ECU diagnostics, and periodic servicing.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(800)
  description!: string;

  @ApiProperty({
    type: [String],
    example: ['Suspension Tuning', 'ECU Diagnostics', 'Periodic Service'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  serviceCategories!: string[];

  @ApiProperty({ example: '42 Indiranagar 100ft Road, HAL 2nd Stage' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(200)
  address!: string;

  @ApiProperty({ example: 'Bengaluru' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(80)
  city!: string;

  @ApiProperty({ example: '+91 98450 77812' })
  @IsString()
  @IsNotEmpty()
  @MinLength(7)
  @MaxLength(30)
  contactPhone!: string;

  @ApiProperty({
    description:
      'Whether to expose the full workshop contact phone publicly (otherwise masked for 1:1 chat privacy).',
    example: false,
  })
  @IsBoolean()
  contactPhonePublic!: boolean;
}

export class UpdateMechanicDto {
  @ApiPropertyOptional({ example: 'Apex MotoWorks & Suspension Lab' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  businessName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(800)
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  serviceCategories?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(30)
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  contactPhonePublic?: boolean;
}

export class VerifyMechanicDto {
  @ApiProperty({
    enum: MechanicVerificationStatus,
    example: MechanicVerificationStatus.VERIFIED,
  })
  @IsEnum(MechanicVerificationStatus)
  status!: MechanicVerificationStatus;

  @ApiPropertyOptional({
    example: 'Verified trade license and physical workshop address in Indiranagar.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  verificationNotes?: string;
}

