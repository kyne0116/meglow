import { IsOptional, IsString } from "class-validator";

export class SubmitPronunciationInputDto {
  @IsString()
  input!: string;

  @IsOptional()
  @IsString()
  audioUrl?: string;

  @IsOptional()
  @IsString()
  expectedText?: string;
}
