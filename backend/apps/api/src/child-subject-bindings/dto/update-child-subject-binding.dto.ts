import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsUUID } from 'class-validator';

export class UpdateChildSubjectBindingDto {
  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  currentNodeId?: string;

  @ApiPropertyOptional({ example: { source: 'parent_manual_update' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
