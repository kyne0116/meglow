import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: '13800138000' })
  @Matches(/^1\d{10}$/, {
    message: 'phone must be a valid mainland China mobile number',
  })
  phone!: string;

  @ApiProperty({ example: '123456' })
  @Matches(/^\d{6}$/, {
    message: 'verificationCode must be a 6-digit code',
  })
  verificationCode!: string;
}
