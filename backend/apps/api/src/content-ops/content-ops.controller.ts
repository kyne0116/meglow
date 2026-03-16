import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AttachContentItemToNodeDto } from './dto/attach-content-item-to-node.dto';
import { AttachKnowledgePointToNodeDto } from './dto/attach-knowledge-point-to-node.dto';
import { CreateContentItemDto } from './dto/create-content-item.dto';
import { CreateContentItemVersionDto } from './dto/create-content-item-version.dto';
import { CreateKnowledgePointDto } from './dto/create-knowledge-point.dto';
import { CreatePublisherDto } from './dto/create-publisher.dto';
import { CreateTextbookEditionDto } from './dto/create-textbook-edition.dto';
import { CreateTextbookNodeDto } from './dto/create-textbook-node.dto';
import { CreateTextbookVolumeDto } from './dto/create-textbook-volume.dto';
import { PublishContentItemVersionDto } from './dto/publish-content-item-version.dto';
import { ContentOpsService } from './content-ops.service';

@ApiTags('content-ops')
@UseGuards(JwtAuthGuard)
@Controller('content-ops')
export class ContentOpsController {
  constructor(private readonly contentOpsService: ContentOpsService) {}

  @Post('publishers')
  createPublisher(@Body() payload: CreatePublisherDto) {
    return this.contentOpsService.createPublisher(payload);
  }

  @Post('textbooks/editions')
  createTextbookEdition(@Body() payload: CreateTextbookEditionDto) {
    return this.contentOpsService.createTextbookEdition(payload);
  }

  @Post('textbooks/editions/:editionId/volumes')
  createTextbookVolume(
    @Param('editionId') editionId: string,
    @Body() payload: CreateTextbookVolumeDto,
  ) {
    return this.contentOpsService.createTextbookVolume(editionId, payload);
  }

  @Post('textbooks/volumes/:volumeId/nodes')
  createTextbookNode(
    @Param('volumeId') volumeId: string,
    @Body() payload: CreateTextbookNodeDto,
  ) {
    return this.contentOpsService.createTextbookNode(volumeId, payload);
  }

  @Post('knowledge-points')
  createKnowledgePoint(@Body() payload: CreateKnowledgePointDto) {
    return this.contentOpsService.createKnowledgePoint(payload);
  }

  @Post('content-items')
  createContentItem(@Body() payload: CreateContentItemDto) {
    return this.contentOpsService.createContentItem(payload);
  }

  @Post('content-items/:contentItemId/versions')
  createContentItemVersion(
    @Param('contentItemId') contentItemId: string,
    @Body() payload: CreateContentItemVersionDto,
  ) {
    return this.contentOpsService.createContentItemVersion(contentItemId, payload);
  }

  @Post('textbooks/nodes/:nodeId/content-items')
  attachContentItemToNode(
    @Param('nodeId') nodeId: string,
    @Body() payload: AttachContentItemToNodeDto,
  ) {
    return this.contentOpsService.attachContentItemToNode(nodeId, payload);
  }

  @Post('textbooks/nodes/:nodeId/knowledge-points')
  attachKnowledgePointToNode(
    @Param('nodeId') nodeId: string,
    @Body() payload: AttachKnowledgePointToNodeDto,
  ) {
    return this.contentOpsService.attachKnowledgePointToNode(nodeId, payload);
  }

  @Post('content-items/:contentItemId/publish')
  publishContentItemVersion(
    @Param('contentItemId') contentItemId: string,
    @Body() payload: PublishContentItemVersionDto,
  ) {
    return this.contentOpsService.publishContentItemVersion(contentItemId, payload);
  }
}
