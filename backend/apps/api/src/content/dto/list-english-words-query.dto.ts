import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const k12Stages = [
  'LOWER_PRIMARY',
  'MIDDLE_PRIMARY',
  'UPPER_PRIMARY',
  'JUNIOR_HIGH',
] as const;

export class ListEnglishWordsQueryDto {
  @ApiPropertyOptional({ enum: k12Stages, example: 'MIDDLE_PRIMARY' })
  @IsOptional()
  @IsIn(k12Stages)
  k12Stage?: 'LOWER_PRIMARY' | 'MIDDLE_PRIMARY' | 'UPPER_PRIMARY' | 'JUNIOR_HIGH';

  @ApiPropertyOptional({ example: 'app' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
