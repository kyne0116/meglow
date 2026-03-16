import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsObject, IsOptional, IsUUID, Min } from 'class-validator';

export class AttachContentItemToNodeDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  contentItemId!: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  contentVersionId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: { source: 'manual_attach' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
