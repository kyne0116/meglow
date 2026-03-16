import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetTextbookTreeQueryDto } from './dto/get-textbook-tree-query.dto';
import { ListKnowledgePointsQueryDto } from './dto/list-knowledge-points-query.dto';
import { ListNodeContentItemsQueryDto } from './dto/list-node-content-items-query.dto';
import { ListTextbookEditionsQueryDto } from './dto/list-textbook-editions-query.dto';
import { ListTextbookVolumesQueryDto } from './dto/list-textbook-volumes-query.dto';
import {
  KnowledgePointRecord,
  NodeContentItemRecord,
  TextbookEditionDetailRecord,
  TextbookEditionRecord,
  TextbookNodeRecord,
  TextbookTreeRecord,
  TextbookVolumeDetailRecord,
  TextbookVolumeRecord,
  TextbooksService,
} from './textbooks.service';

@ApiTags('textbooks')
@Controller('textbooks')
export class TextbooksController {
  constructor(private readonly textbooksService: TextbooksService) {}

  @Get('editions')
  listEditions(@Query() query: ListTextbookEditionsQueryDto): Promise<TextbookEditionRecord[]> {
    return this.textbooksService.listEditions(query);
  }

  @Get('editions/:editionId')
  getEdition(@Param('editionId') editionId: string): Promise<TextbookEditionDetailRecord> {
    return this.textbooksService.getEdition(editionId);
  }

  @Get('editions/:editionId/volumes')
  listVolumes(
    @Param('editionId') editionId: string,
    @Query() query: ListTextbookVolumesQueryDto,
  ): Promise<TextbookVolumeRecord[]> {
    return this.textbooksService.listVolumes(editionId, query);
  }

  @Get('volumes/:volumeId')
  getVolume(@Param('volumeId') volumeId: string): Promise<TextbookVolumeDetailRecord> {
    return this.textbooksService.getVolume(volumeId);
  }

  @Get('volumes/:volumeId/tree')
  getVolumeTree(
    @Param('volumeId') volumeId: string,
    @Query() query: GetTextbookTreeQueryDto,
  ): Promise<TextbookTreeRecord> {
    return this.textbooksService.getVolumeTree(volumeId, query);
  }

  @Get('nodes/:nodeId')
  getNode(@Param('nodeId') nodeId: string): Promise<TextbookNodeRecord> {
    return this.textbooksService.getNode(nodeId);
  }

  @Get('nodes/:nodeId/content-items')
  listNodeContentItems(
    @Param('nodeId') nodeId: string,
    @Query() query: ListNodeContentItemsQueryDto,
  ): Promise<NodeContentItemRecord[]> {
    return this.textbooksService.listNodeContentItems(nodeId, query);
  }

  @Get('nodes/:nodeId/knowledge-points')
  getNodeKnowledgePoints(@Param('nodeId') nodeId: string): Promise<KnowledgePointRecord[]> {
    return this.textbooksService.getNodeKnowledgePoints(nodeId);
  }

  @Get('knowledge-points')
  listKnowledgePoints(@Query() query: ListKnowledgePointsQueryDto): Promise<KnowledgePointRecord[]> {
    return this.textbooksService.listKnowledgePoints(query);
  }
}
