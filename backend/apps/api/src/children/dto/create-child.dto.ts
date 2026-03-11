import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

const genders = ['MALE', 'FEMALE'] as const;

export class CreateChildDto {
  @ApiProperty({ example: '小明' })
  @IsString()
  @MinLength(1, { message: 'name is required' })
  name!: string;

  @ApiProperty({ example: 'MALE', enum: genders })
  @IsIn(genders, { message: 'gender must be one of MALE or FEMALE' })
  gender!: 'MALE' | 'FEMALE';

  @ApiPropertyOptional({ example: '2018-01-01' })
  @IsOptional()
  @IsDateString({}, { message: 'birthDate must be a valid date string' })
  birthDate?: string | null;

  @ApiProperty({ example: 3, minimum: 1, maximum: 9 })
  @IsInt()
  @Min(1)
  @Max(9)
  grade!: number;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsString()
  avatarUrl?: string | null;
}
