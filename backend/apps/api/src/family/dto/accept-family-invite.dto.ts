import { ApiProperty } from '@nestjs/swagger';
import { Matches, MinLength } from 'class-validator';

export class AcceptFamilyInviteDto {
  @ApiProperty({ example: 'invite-token' })
  @MinLength(1, { message: 'token is required' })
  token!: string;

  @ApiProperty({ example: '13900139000' })
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
