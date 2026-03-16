import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { K12Stage, SemesterType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateTextbookVolumeDto {
  @ApiProperty({ example: 3, minimum: 1, maximum: 9 })
  @IsInt()
  @Min(1)
  @Max(9)
  grade!: number;

  @ApiProperty({ enum: SemesterType, example: SemesterType.FIRST_TERM })
  @IsEnum(SemesterType)
  semester!: SemesterType;

  @ApiProperty({ example: '三年级上册' })
  @IsString()
  @MaxLength(50)
  volumeLabel!: string;

  @ApiProperty({ enum: K12Stage, example: K12Stage.MIDDLE_PRIMARY })
  @IsEnum(K12Stage)
  k12Stage!: K12Stage;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}
