import { IsDateString, IsEnum, IsObject, IsOptional, IsString } from "class-validator";
import { LearningType, Subject } from "@prisma/client";

export class CreatePushDto {
  @IsString()
  childId!: string;

  @IsEnum(Subject)
  @IsOptional()
  subject?: Subject;

  @IsEnum(LearningType)
  @IsOptional()
  type?: LearningType;

  @IsString()
  summary!: string;

  @IsString()
  reason!: string;

  @IsString()
  expectedOutcome!: string;

  @IsObject()
  content!: Record<string, unknown>;

  @IsDateString()
  scheduledAt!: string;
}
