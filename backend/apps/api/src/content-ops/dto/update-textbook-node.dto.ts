import { ApiPropertyOptional } from '@nestjs/swagger';
import { TextbookNodeType } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class UpdateTextbookNodeDto {
  @ApiPropertyOptional({ example: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({ enum: TextbookNodeType, example: TextbookNodeType.LESSON })
  @IsOptional()
  @IsEnum(TextbookNodeType)
  nodeType?: TextbookNodeType;

  @ApiPropertyOptional({ example: 'L2' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nodeCode?: string;

  @ApiPropertyOptional({ example: '第一课' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: '课文学习' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 2, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isLeaf?: boolean;

  @ApiPropertyOptional({ example: { pageStart: 2, pageEnd: 5 } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
