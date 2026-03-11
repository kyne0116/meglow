import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class SendVerificationCodeDto {
  @ApiProperty({ example: '13800138000' })
  @Matches(/^1\d{10}$/, {
    message: 'phone must be a valid mainland China mobile number',
  })
  phone!: string;
}
