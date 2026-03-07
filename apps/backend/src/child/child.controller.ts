import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { Subject } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { ChildService } from "./child.service";
import { CreateChildDto } from "./dto/create-child.dto";
import { UpsertChildSettingsDto } from "./dto/upsert-child-settings.dto";

type ChildSummary = {
  id: string;
  familyId: string;
  name: string;
  gender: string;
  grade: number;
  k12Stage: string;
};
type ChildSettingsView = {
  childId: string;
  subject: Subject;
  autoApprove: boolean;
  weekdayTimeWindows: Array<{ start: string; end: string }>;
  weekendTimeWindows: Array<{ start: string; end: string }>;
  dailyDurationMin: number;
  wordsPerSession: number;
};

@UseGuards(JwtAuthGuard)
@Controller("children")
export class ChildController {
  constructor(private readonly childService: ChildService) {}

  @Post()
  async createChild(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateChildDto
  ): Promise<ChildSummary> {
    return this.childService.createChild(user, dto);
  }

  @Get()
  async listChildren(@CurrentUser() user: JwtPayload): Promise<ChildSummary[]> {
    return this.childService.listChildren(user);
  }

  @Get(":childId/profile")
  async getProfile(
    @CurrentUser() user: JwtPayload,
    @Param("childId") childId: string
  ): Promise<{
    child: ChildSummary;
    profile: {
      childId: string;
      learningStyle: Record<string, number>;
      attentionSpan: number;
      interests: string[];
    };
  }> {
    return this.childService.getChildProfile(user, childId);
  }

  @Get(":childId/settings")
  async getSettings(
    @CurrentUser() user: JwtPayload,
    @Param("childId") childId: string
  ): Promise<ChildSettingsView> {
    return this.childService.getSettings(user, childId);
  }

  @Put(":childId/settings")
  async upsertSettings(
    @CurrentUser() user: JwtPayload,
    @Param("childId") childId: string,
    @Body() dto: UpsertChildSettingsDto
  ): Promise<ChildSettingsView> {
    return this.childService.upsertSettings(user, childId, dto);
  }
}
