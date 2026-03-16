import { ApiPropertyOptional } from '@nestjs/swagger';
import { K12Stage, SubjectCode } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { toOptionalBoolean } from '../../common/utils/query-transformers';

export class ListKnowledgePointsQueryDto {
  @ApiPropertyOptional({ enum: SubjectCode, example: SubjectCode.CHINESE })
  @IsOptional()
  @IsEnum(SubjectCode)
  subjectCode?: SubjectCode;

  @ApiPropertyOptional({ enum: K12Stage, example: K12Stage.MIDDLE_PRIMARY })
  @IsOptional()
  @IsEnum(K12Stage)
  k12Stage?: K12Stage;

  @ApiPropertyOptional({ example: '阅读' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  keyword?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  enabled?: boolean;
}
