import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

const pushActions = ['APPROVE', 'REJECT', 'MODIFY', 'POSTPONE'] as const;

export class ApprovePushDto {
  @ApiProperty({ enum: pushActions, example: 'MODIFY' })
  @IsIn(pushActions)
  action!: 'APPROVE' | 'REJECT' | 'MODIFY' | 'POSTPONE';

  @ApiPropertyOptional({ example: '减少词量' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;

  @ApiPropertyOptional({
    example: {
      mode: 'word_review',
      dueWords: 2,
      newWords: 1,
    },
  })
  @IsOptional()
  @IsObject()
  modifiedContent?: Record<string, unknown>;

  @ApiPropertyOptional({ example: '2026-03-11T08:00:00.000Z' })
  @IsOptional()
  @IsString()
  postponedUntil?: string;
}
