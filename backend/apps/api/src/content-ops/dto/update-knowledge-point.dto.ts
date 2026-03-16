import { ApiPropertyOptional } from '@nestjs/swagger';
import { K12Stage } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateKnowledgePointDto {
  @ApiPropertyOptional({ example: 'MATH_FRACTION_COMPARE' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  code?: string;

  @ApiPropertyOptional({ example: '分数大小比较' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: '比较分数大小规律' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  difficultyLevel?: number;

  @ApiPropertyOptional({ enum: K12Stage, example: K12Stage.UPPER_PRIMARY })
  @IsOptional()
  @IsEnum(K12Stage)
  k12Stage?: K12Stage;

  @ApiPropertyOptional({ example: { tags: ['分数', '比较'] } })
  @IsOptional()
  @IsObject()
  tags?: Record<string, unknown>;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
