import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class OpenConversationDto {
  @ApiProperty({ example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @IsString()
  @MinLength(1)
  recipientUserId!: string;

  @ApiPropertyOptional({ example: 'Community: Western Ghats ADV Tourers' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  contextLabel?: string;
}

export class SendDirectMessageDto {
  @ApiProperty({
    example: 'Hey! Are you joining the Sunday breakfast ride to Sakleshpur?',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;

  @ApiPropertyOptional({ example: 'Community: Western Ghats ADV Tourers' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  contextLabel?: string;
}

