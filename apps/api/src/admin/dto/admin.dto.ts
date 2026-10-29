import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  AccountStatus,
  ModerationTargetType,
  ReportStatus,
} from '@ridersclub/types';

export class CreateContentReportDto {
  @ApiProperty({
    enum: ModerationTargetType,
    example: ModerationTargetType.LISTING,
  })
  @IsEnum(ModerationTargetType)
  targetType!: ModerationTargetType;

  @ApiProperty({ example: 'list-1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  targetId!: string;

  @ApiProperty({ example: '2023 Triumph Street Triple 765 R' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  targetLabel!: string;

  @ApiProperty({
    example:
      'Suspected duplicate listing requesting advance deposit outside platform.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(600)
  reason!: string;
}

export class ResolveContentReportDto {
  @ApiProperty({
    enum: [ReportStatus.ACTIONED, ReportStatus.DISMISSED],
    example: ReportStatus.ACTIONED,
  })
  @IsEnum(ReportStatus)
  status!: ReportStatus.ACTIONED | ReportStatus.DISMISSED;

  @ApiProperty({ example: 'REPORT_ACTIONED_LISTING_WARNED' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  actionTaken!: string;

  @ApiPropertyOptional({
    example:
      'Reviewed listing photos and issued seller compliance warning; added buyer advisory note.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  resolutionNotes?: string;
}

export class AdminUpdateUserStatusDto {
  @ApiProperty({
    enum: AccountStatus,
    example: AccountStatus.SUSPENDED,
  })
  @IsEnum(AccountStatus)
  accountStatus!: AccountStatus;

  @ApiProperty({
    example: 'Repeated spam listings in Marketplace after prior warning.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(400)
  reason!: string;
}

