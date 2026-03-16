import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class AttachKnowledgePointToNodeDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  knowledgePointId!: string;

  @ApiPropertyOptional({ example: 'PRIMARY' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  relationType?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
