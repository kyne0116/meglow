import { ApiPropertyOptional } from '@nestjs/swagger';
import { TextbookNodeType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class GetTextbookTreeQueryDto {
  @ApiPropertyOptional({ example: 2, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  depth?: number;

  @ApiPropertyOptional({ enum: TextbookNodeType, example: TextbookNodeType.LESSON })
  @IsOptional()
  @IsEnum(TextbookNodeType)
  nodeType?: TextbookNodeType;
}
