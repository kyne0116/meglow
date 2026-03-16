import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class PublishContentItemVersionDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  versionId!: string;
}
