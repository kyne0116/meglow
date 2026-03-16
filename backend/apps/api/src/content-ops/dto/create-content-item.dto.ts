import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentItemType, K12Stage, SubjectCode } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateContentItemDto {
  @ApiProperty({ enum: SubjectCode, example: SubjectCode.ENGLISH })
  @IsEnum(SubjectCode)
  subjectCode!: SubjectCode;

  @ApiProperty({ enum: ContentItemType, example: ContentItemType.WORD })
  @IsEnum(ContentItemType)
  itemType!: ContentItemType;

  @ApiPropertyOptional({ example: 'apple' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  canonicalKey?: string;

  @ApiProperty({ example: 'apple' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ example: '水果类高频词' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  difficultyLevel?: number;

  @ApiPropertyOptional({ enum: K12Stage, example: K12Stage.LOWER_PRIMARY })
  @IsOptional()
  @IsEnum(K12Stage)
  k12Stage?: K12Stage;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isReusable?: boolean;
}
