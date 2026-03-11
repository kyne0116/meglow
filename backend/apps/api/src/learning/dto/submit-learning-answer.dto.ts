import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString, MinLength } from 'class-validator';

export class SubmitLearningAnswerDto {
  @ApiProperty({ example: 'session-item-uuid' })
  @IsString()
  @MinLength(1)
  sessionItemId!: string;

  @ApiProperty({
    example: {
      selected: '苹果',
    },
  })
  @IsObject()
  answer!: Record<string, unknown>;
}
