import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubjectCode } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTextbookEditionDto {
  @ApiProperty({ enum: SubjectCode, example: SubjectCode.CHINESE })
  @IsEnum(SubjectCode)
  subjectCode!: SubjectCode;

  @ApiProperty({ example: 'PEP' })
  @IsString()
  @MaxLength(50)
  publisherCode!: string;

  @ApiProperty({ example: 'PEP_CHINESE' })
  @IsString()
  @MaxLength(80)
  code!: string;

  @ApiProperty({ example: '语文 人教版' })
  @IsString()
  @MaxLength(100)
  displayName!: string;

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @IsInt()
  curriculumYear?: number;

  @ApiPropertyOptional({ example: '全国通用' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  regionScope?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
