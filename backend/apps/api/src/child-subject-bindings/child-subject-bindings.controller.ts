import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentParentContext } from '../common/decorators/current-parent.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentParent } from '../common/interfaces/current-parent.interface';
import { CreateChildSubjectBindingDto } from './dto/create-child-subject-binding.dto';
import { UpdateChildSubjectBindingDto } from './dto/update-child-subject-binding.dto';
import { UpdateChildSubjectProgressDto } from './dto/update-child-subject-progress.dto';
import {
  ChildSubjectBindingRecord,
  ChildSubjectBindingsService,
  ChildSubjectProgressRecord,
} from './child-subject-bindings.service';

@ApiTags('child-subject-bindings')
@UseGuards(JwtAuthGuard)
@Controller('children/:childId/subjects/bindings')
export class ChildSubjectBindingsController {
  constructor(private readonly childSubjectBindingsService: ChildSubjectBindingsService) {}

  @Get()
  getBindings(
    @CurrentParentContext() currentParent: CurrentParent,
    @Param('childId') childId: string,
  ): Promise<ChildSubjectBindingRecord[]> {
    return this.childSubjectBindingsService.getBindings(currentParent.familyId, childId);
  }

  @Post()
  createBinding(
    @CurrentParentContext() currentParent: CurrentParent,
    @Param('childId') childId: string,
    @Body() payload: CreateChildSubjectBindingDto,
  ): Promise<ChildSubjectBindingRecord> {
    return this.childSubjectBindingsService.createBinding(currentParent, childId, payload);
  }

  @Put(':bindingId')
  updateBinding(
    @CurrentParentContext() currentParent: CurrentParent,
    @Param('childId') childId: string,
    @Param('bindingId') bindingId: string,
    @Body() payload: UpdateChildSubjectBindingDto,
  ): Promise<ChildSubjectBindingRecord> {
    return this.childSubjectBindingsService.updateBinding(
      currentParent.familyId,
      childId,
      bindingId,
      payload,
    );
  }

  @Post(':bindingId/archive')
  archiveBinding(
    @CurrentParentContext() currentParent: CurrentParent,
    @Param('childId') childId: string,
    @Param('bindingId') bindingId: string,
  ): Promise<{ bindingId: string; status: string }> {
    return this.childSubjectBindingsService.archiveBinding(
      currentParent.familyId,
      childId,
      bindingId,
    );
  }

  @Get(':bindingId/progress')
  getProgress(
    @CurrentParentContext() currentParent: CurrentParent,
    @Param('childId') childId: string,
    @Param('bindingId') bindingId: string,
  ): Promise<ChildSubjectProgressRecord> {
    return this.childSubjectBindingsService.getProgress(currentParent.familyId, childId, bindingId);
  }

  @Put(':bindingId/progress')
  updateProgress(
    @CurrentParentContext() currentParent: CurrentParent,
    @Param('childId') childId: string,
    @Param('bindingId') bindingId: string,
    @Body() payload: UpdateChildSubjectProgressDto,
  ): Promise<ChildSubjectProgressRecord> {
    return this.childSubjectBindingsService.updateProgress(
      currentParent.familyId,
      childId,
      bindingId,
      payload,
    );
  }
}
