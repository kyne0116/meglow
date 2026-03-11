import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentParentContext } from '../common/decorators/current-parent.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentParent } from '../common/interfaces/current-parent.interface';
import {
  ChildRecord,
  ChildSettingsRecord,
  ChildrenService,
} from './children.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpsertChildLearningSettingsDto } from './dto/upsert-child-learning-settings.dto';

@ApiTags('children')
@UseGuards(JwtAuthGuard)
@Controller('children')
export class ChildrenController {
  constructor(private readonly childrenService: ChildrenService) {}

  @Get()
  getChildren(@CurrentParentContext() currentParent: CurrentParent): Promise<ChildRecord[]> {
    return this.childrenService.getChildren(currentParent.familyId);
  }

  @Post()
  createChild(
    @CurrentParentContext() currentParent: CurrentParent,
    @Body() payload: CreateChildDto,
  ): Promise<ChildRecord> {
    return this.childrenService.createChild(currentParent.familyId, payload);
  }

  @Get(':childId')
  getChild(
    @CurrentParentContext() currentParent: CurrentParent,
    @Param('childId') childId: string,
  ): Promise<ChildRecord> {
    return this.childrenService.getChild(currentParent.familyId, childId);
  }

  @Get(':childId/settings')
  getSettings(
    @CurrentParentContext() currentParent: CurrentParent,
    @Param('childId') childId: string,
  ): Promise<ChildSettingsRecord> {
    return this.childrenService.getSettings(currentParent.familyId, childId);
  }

  @Put(':childId/settings')
  updateSettings(
    @CurrentParentContext() currentParent: CurrentParent,
    @Param('childId') childId: string,
    @Body() payload: UpsertChildLearningSettingsDto,
  ): Promise<ChildSettingsRecord> {
    return this.childrenService.updateSettings(currentParent.familyId, childId, payload);
  }
}
