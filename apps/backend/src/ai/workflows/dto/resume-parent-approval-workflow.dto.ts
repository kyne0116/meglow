import { ApprovalAction } from "@prisma/client";
import { IsDateString, IsEnum, IsObject, IsOptional, IsString } from "class-validator";

export class ResumeParentApprovalWorkflowDto {
  @IsEnum(ApprovalAction)
  action!: ApprovalAction;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsObject()
  modifiedContent?: Record<string, unknown>;

  @IsOptional()
  @IsDateString()
  postponedUntil?: string;
}
