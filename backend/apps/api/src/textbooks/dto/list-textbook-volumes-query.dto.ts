import { ApiPropertyOptional } from '@nestjs/swagger';
import { SemesterType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { toOptionalBoolean } from '../../common/utils/query-transformers';

export class ListTextbookVolumesQueryDto {
  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 9 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9)
  grade?: number;

  @ApiPropertyOptional({ enum: SemesterType, example: SemesterType.FIRST_TERM })
  @IsOptional()
  @IsEnum(SemesterType)
  semester?: SemesterType;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  publishedOnly?: boolean;
}
