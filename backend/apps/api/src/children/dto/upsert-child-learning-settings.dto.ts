import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class TimeWindowDto {
  @ApiPropertyOptional({ example: '18:30' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'start must use HH:mm format',
  })
  start!: string;

  @ApiPropertyOptional({ example: '20:00' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'end must use HH:mm format',
  })
  end!: string;
}

export class UpsertChildLearningSettingsDto {
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  autoApprove?: boolean;

  @ApiPropertyOptional({ type: [TimeWindowDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeWindowDto)
  weekdayTimeWindows?: TimeWindowDto[];

  @ApiPropertyOptional({ type: [TimeWindowDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeWindowDto)
  weekendTimeWindows?: TimeWindowDto[];

  @ApiPropertyOptional({ example: 20, minimum: 5, maximum: 240 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(240)
  dailyDurationMin?: number;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  wordsPerSession?: number;
}
