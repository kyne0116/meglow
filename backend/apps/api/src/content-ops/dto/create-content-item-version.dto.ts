import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateContentItemVersionDto {
  @ApiProperty({ example: 'apple' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ example: { word: 'apple', meaningZh: '苹果' } })
  @IsObject()
  payload!: Record<string, unknown>;

  @ApiPropertyOptional({ example: '初始化版本' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeSummary?: string;
}
