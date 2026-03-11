import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateLearningSessionDto {
  @ApiProperty({ example: 'task-uuid' })
  @IsString()
  @MinLength(1)
  taskId!: string;
}
