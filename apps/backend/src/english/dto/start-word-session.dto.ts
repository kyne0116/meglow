import { IsArray, IsOptional, IsString } from "class-validator";

export class StartWordSessionDto {
  @IsString()
  childId!: string;

  @IsOptional()
  @IsArray()
  words?: string[];
}
