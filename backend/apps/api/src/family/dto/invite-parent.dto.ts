import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class InviteParentDto {
  @ApiProperty({ example: '13900139000' })
  @Matches(/^1\d{10}$/, {
    message: 'phone must be a valid mainland China mobile number',
  })
  phone!: string;
}
