import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentParentContext } from '../common/decorators/current-parent.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentParent } from '../common/interfaces/current-parent.interface';
import { ApprovePushDto } from './dto/approve-push.dto';
import { ListChildTasksQueryDto } from './dto/list-child-tasks-query.dto';
import { ListPendingPushesQueryDto } from './dto/list-pending-pushes-query.dto';
import { PendingPushRecord, PushesService, TaskRecord } from './pushes.service';

@ApiTags('pushes')
@UseGuards(JwtAuthGuard)
@Controller('pushes')
export class PushesController {
  constructor(private readonly pushesService: PushesService) {}

  @Get('pending')
  getPendingPushes(
    @CurrentParentContext() currentParent: CurrentParent,
    @Query() query: ListPendingPushesQueryDto,
  ): Promise<PendingPushRecord[]> {
    return this.pushesService.getPendingPushes(currentParent.familyId, query.childId);
  }

  @Post(':pushId/approve')
  approvePush(
    @CurrentParentContext() currentParent: CurrentParent,
    @Param('pushId') pushId: string,
    @Body() payload: ApprovePushDto,
  ): Promise<{ pushId: string; status: string }> {
    return this.pushesService.approvePush(currentParent, pushId, payload);
  }

  @Get('tasks/:childId')
  getTasks(
    @CurrentParentContext() currentParent: CurrentParent,
    @Param('childId') childId: string,
    @Query() query: ListChildTasksQueryDto,
  ): Promise<TaskRecord[]> {
    return this.pushesService.getTasks(currentParent.familyId, childId, query.date);
  }

  @Post(':pushId/deliver')
  deliverPush(
    @CurrentParentContext() currentParent: CurrentParent,
    @Param('pushId') pushId: string,
  ): Promise<{ pushId: string; status: string }> {
    return this.pushesService.deliverPush(currentParent.familyId, pushId);
  }

  @Post(':pushId/complete')
  completePush(
    @CurrentParentContext() currentParent: CurrentParent,
    @Param('pushId') pushId: string,
  ): Promise<{ pushId: string; status: string }> {
    return this.pushesService.completePush(currentParent.familyId, pushId);
  }
}
