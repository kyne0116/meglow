import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class ListPendingPushesQueryDto {
  @ApiPropertyOptional({ example: '8f16e3f0-5406-4d5b-aed0-8aa0f9d19d11' })
  @IsOptional()
  @IsUUID()
  childId?: string;
}
