import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SemesterType, SubjectCode } from '@prisma/client';
import { IsEnum, IsInt, IsObject, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class CreateChildSubjectBindingDto {
  @ApiProperty({ enum: SubjectCode, example: SubjectCode.CHINESE })
  @IsEnum(SubjectCode)
  subjectCode!: SubjectCode;

  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  editionId!: string;

  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  volumeId!: string;

  @ApiProperty({ example: 3, minimum: 1, maximum: 9 })
  @IsInt()
  @Min(1)
  @Max(9)
  grade!: number;

  @ApiProperty({ enum: SemesterType, example: SemesterType.FIRST_TERM })
  @IsEnum(SemesterType)
  semester!: SemesterType;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  currentNodeId?: string;

  @ApiPropertyOptional({ example: { source: 'parent_manual_select' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
