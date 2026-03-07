import { IsString, Length, Matches } from "class-validator";

export class LoginDto {
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: "手机号格式不正确" })
  phone!: string;

  @IsString()
  @Length(6, 6, { message: "验证码长度必须为6位" })
  verificationCode!: string;
}
