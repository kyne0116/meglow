import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { K12Stage, SubjectCode } from '@prisma/client';
import { IsEnum, IsInt, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateKnowledgePointDto {
  @ApiProperty({ enum: SubjectCode, example: SubjectCode.MATH })
  @IsEnum(SubjectCode)
  subjectCode!: SubjectCode;

  @ApiProperty({ example: 'MATH_FRACTION_COMPARE' })
  @IsString()
  @MaxLength(80)
  code!: string;

  @ApiProperty({ example: '分数大小比较' })
  @IsString()
  @MaxLength(120)
  name!: string;

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
}
