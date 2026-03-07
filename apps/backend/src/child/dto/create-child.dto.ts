import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE"
}

export class CreateChildDto {
  @IsString()
  name!: string;

  @IsEnum(Gender)
  gender!: Gender;

  @IsDateString()
  birthDate!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9)
  grade!: number;

  @IsOptional()
  @IsString()
  schoolName?: string;
}
