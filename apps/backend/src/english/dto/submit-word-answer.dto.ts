import { IsBoolean, IsOptional, IsString } from "class-validator";

export class SubmitWordAnswerDto {
  @IsString()
  word!: string;

  @IsString()
  answer!: string;

  @IsBoolean()
  correct!: boolean;

  @IsOptional()
  @IsString()
  feedback?: string;
}
