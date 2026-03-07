import { IsObject, IsOptional, IsString } from "class-validator";

export class StartScenarioSessionDto {
  @IsString()
  childId!: string;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
