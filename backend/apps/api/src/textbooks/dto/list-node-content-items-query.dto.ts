import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContentItemType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { toOptionalBoolean } from '../../common/utils/query-transformers';

export class ListNodeContentItemsQueryDto {
  @ApiPropertyOptional({ enum: ContentItemType, example: ContentItemType.WORD })
  @IsOptional()
  @IsEnum(ContentItemType)
  itemType?: ContentItemType;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  includeDraft?: boolean;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
