import { ApiPropertyOptional } from '@nestjs/swagger';
import { SubjectCode } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { toOptionalBoolean } from '../../common/utils/query-transformers';

export class ListTextbookEditionsQueryDto {
  @ApiPropertyOptional({ enum: SubjectCode, example: SubjectCode.ENGLISH })
  @IsOptional()
  @IsEnum(SubjectCode)
  subjectCode?: SubjectCode;

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 9 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9)
  grade?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  enabled?: boolean;
}
