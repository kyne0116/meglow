import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { AdminAuditService } from '../admin-audit/admin-audit.service';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { CurrentAdminContext } from '../common/decorators/current-admin.decorator';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { CurrentAdmin } from '../common/interfaces/current-admin.interface';
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
import { UpdateKnowledgePointDto } from './dto/update-knowledge-point.dto';
import { UpdateTextbookNodeDto } from './dto/update-textbook-node.dto';
import { ContentOpsService } from './content-ops.service';

@ApiTags('admin-content-ops')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@Controller('admin-content-ops')
export class AdminContentOpsController {
  constructor(
    private readonly contentOpsService: ContentOpsService,
    private readonly adminAuditService: AdminAuditService,
  ) {}

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.CONTENT_EDITOR, AdminRole.CONTENT_PUBLISHER)
  @Post('publishers')
  async createPublisher(
    @CurrentAdminContext() currentAdmin: CurrentAdmin,
    @Body() payload: CreatePublisherDto,
  ) {
    return this.withAudit(currentAdmin, {
      action: 'PUBLISHER_CREATED',
      targetType: 'PUBLISHER',
      summary: (result) => `创建出版社 ${result.code}`,
      targetId: () => null,
      payload: {
        code: payload.code,
      },
      operation: () => this.contentOpsService.createPublisher(payload),
    });
  }

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.CONTENT_EDITOR, AdminRole.CONTENT_PUBLISHER)
  @Post('textbooks/editions')
  async createTextbookEdition(
    @CurrentAdminContext() currentAdmin: CurrentAdmin,
    @Body() payload: CreateTextbookEditionDto,
  ) {
    return this.withAudit(currentAdmin, {
      action: 'TEXTBOOK_EDITION_CREATED',
      targetType: 'TEXTBOOK_EDITION',
      summary: (result) => `创建教材版本 ${result.code}`,
      targetId: (result) => result.id,
      payload: {
        subjectCode: payload.subjectCode,
        publisherCode: payload.publisherCode,
      },
      operation: () => this.contentOpsService.createTextbookEdition(payload),
    });
  }

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.CONTENT_EDITOR, AdminRole.CONTENT_PUBLISHER)
  @Post('textbooks/editions/:editionId/volumes')
  async createTextbookVolume(
    @CurrentAdminContext() currentAdmin: CurrentAdmin,
    @Param('editionId') editionId: string,
    @Body() payload: CreateTextbookVolumeDto,
  ) {
    return this.withAudit(currentAdmin, {
      action: 'TEXTBOOK_VOLUME_CREATED',
      targetType: 'TEXTBOOK_VOLUME',
      summary: (result) => `创建册次 ${result.volumeLabel}`,
      targetId: (result) => result.id,
      payload: {
        editionId,
        grade: payload.grade,
        semester: payload.semester,
      },
      operation: () => this.contentOpsService.createTextbookVolume(editionId, payload),
    });
  }

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.CONTENT_EDITOR, AdminRole.CONTENT_PUBLISHER)
  @Post('textbooks/volumes/:volumeId/nodes')
  async createTextbookNode(
    @CurrentAdminContext() currentAdmin: CurrentAdmin,
    @Param('volumeId') volumeId: string,
    @Body() payload: CreateTextbookNodeDto,
  ) {
    return this.withAudit(currentAdmin, {
      action: 'TEXTBOOK_NODE_CREATED',
      targetType: 'TEXTBOOK_NODE',
      summary: (result) => `创建目录节点 ${result.title}`,
      targetId: (result) => result.id,
      payload: {
        volumeId,
        parentId: payload.parentId ?? null,
        nodeType: payload.nodeType,
      },
      operation: () => this.contentOpsService.createTextbookNode(volumeId, payload),
    });
  }

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.CONTENT_EDITOR, AdminRole.CONTENT_PUBLISHER)
  @Patch('textbooks/nodes/:nodeId')
  async updateTextbookNode(
    @CurrentAdminContext() currentAdmin: CurrentAdmin,
    @Param('nodeId') nodeId: string,
    @Body() payload: UpdateTextbookNodeDto,
  ) {
    return this.withAudit(currentAdmin, {
      action: 'TEXTBOOK_NODE_UPDATED',
      targetType: 'TEXTBOOK_NODE',
      summary: (result) => `更新目录节点 ${result.title}`,
      targetId: (result) => result.id,
      payload: {
        nodeId,
        parentId: payload.parentId ?? undefined,
        sortOrder: payload.sortOrder,
      },
      operation: () => this.contentOpsService.updateTextbookNode(nodeId, payload),
    });
  }

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.CONTENT_EDITOR, AdminRole.CONTENT_PUBLISHER)
  @Delete('textbooks/nodes/:nodeId')
  async deleteTextbookNode(
    @CurrentAdminContext() currentAdmin: CurrentAdmin,
    @Param('nodeId') nodeId: string,
  ) {
    return this.withAudit(currentAdmin, {
      action: 'TEXTBOOK_NODE_DELETED',
      targetType: 'TEXTBOOK_NODE',
      summary: () => `删除目录节点 ${nodeId}`,
      targetId: () => nodeId,
      payload: {
        nodeId,
      },
      operation: () => this.contentOpsService.deleteTextbookNode(nodeId),
    });
  }

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.CONTENT_EDITOR, AdminRole.CONTENT_PUBLISHER)
  @Post('knowledge-points')
  async createKnowledgePoint(
    @CurrentAdminContext() currentAdmin: CurrentAdmin,
    @Body() payload: CreateKnowledgePointDto,
  ) {
    return this.withAudit(currentAdmin, {
      action: 'KNOWLEDGE_POINT_CREATED',
      targetType: 'KNOWLEDGE_POINT',
      summary: (result) => `创建知识点 ${result.code}`,
      targetId: (result) => result.id,
      payload: {
        subjectCode: payload.subjectCode,
        code: payload.code,
      },
      operation: () => this.contentOpsService.createKnowledgePoint(payload),
    });
  }

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.CONTENT_EDITOR, AdminRole.CONTENT_PUBLISHER)
  @Patch('knowledge-points/:knowledgePointId')
  async updateKnowledgePoint(
    @CurrentAdminContext() currentAdmin: CurrentAdmin,
    @Param('knowledgePointId') knowledgePointId: string,
    @Body() payload: UpdateKnowledgePointDto,
  ) {
    return this.withAudit(currentAdmin, {
      action: 'KNOWLEDGE_POINT_UPDATED',
      targetType: 'KNOWLEDGE_POINT',
      summary: (result) => `更新知识点 ${result.code}`,
      targetId: (result) => result.id,
      payload: {
        knowledgePointId,
        isEnabled: payload.isEnabled,
      },
      operation: () => this.contentOpsService.updateKnowledgePoint(knowledgePointId, payload),
    });
  }

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.CONTENT_EDITOR, AdminRole.CONTENT_PUBLISHER)
  @Post('content-items')
  async createContentItem(
    @CurrentAdminContext() currentAdmin: CurrentAdmin,
    @Body() payload: CreateContentItemDto,
  ) {
    return this.withAudit(currentAdmin, {
      action: 'CONTENT_ITEM_CREATED',
      targetType: 'CONTENT_ITEM',
      summary: (result) => `创建内容项 ${result.title}`,
      targetId: (result) => result.id,
      payload: {
        subjectCode: payload.subjectCode,
        itemType: payload.itemType,
      },
      operation: () => this.contentOpsService.createContentItem(payload),
    });
  }

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.CONTENT_EDITOR, AdminRole.CONTENT_PUBLISHER)
  @Post('content-items/:contentItemId/versions')
  async createContentItemVersion(
    @CurrentAdminContext() currentAdmin: CurrentAdmin,
    @Param('contentItemId') contentItemId: string,
    @Body() payload: CreateContentItemVersionDto,
  ) {
    return this.withAudit(currentAdmin, {
      action: 'CONTENT_ITEM_VERSION_CREATED',
      targetType: 'CONTENT_ITEM_VERSION',
      summary: (result) => `创建内容版本 v${result.version}`,
      targetId: (result) => result.id,
      payload: {
        contentItemId,
      },
      operation: () => this.contentOpsService.createContentItemVersion(contentItemId, payload),
    });
  }

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.CONTENT_EDITOR, AdminRole.CONTENT_PUBLISHER)
  @Post('textbooks/nodes/:nodeId/content-items')
  async attachContentItemToNode(
    @CurrentAdminContext() currentAdmin: CurrentAdmin,
    @Param('nodeId') nodeId: string,
    @Body() payload: AttachContentItemToNodeDto,
  ) {
    return this.withAudit(currentAdmin, {
      action: 'NODE_CONTENT_ITEM_ATTACHED',
      targetType: 'TEXTBOOK_NODE_CONTENT_ITEM',
      summary: () => `挂载内容项到目录节点 ${nodeId}`,
      targetId: (result) => result.id,
      payload: {
        nodeId,
        contentItemId: payload.contentItemId,
      },
      operation: () => this.contentOpsService.attachContentItemToNode(nodeId, payload),
    });
  }

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.CONTENT_EDITOR, AdminRole.CONTENT_PUBLISHER)
  @Delete('textbooks/nodes/:nodeId/content-items/:contentItemId')
  async detachContentItemFromNode(
    @CurrentAdminContext() currentAdmin: CurrentAdmin,
    @Param('nodeId') nodeId: string,
    @Param('contentItemId') contentItemId: string,
  ) {
    return this.withAudit(currentAdmin, {
      action: 'NODE_CONTENT_ITEM_DETACHED',
      targetType: 'TEXTBOOK_NODE_CONTENT_ITEM',
      summary: () => `解绑目录节点内容项 ${contentItemId}`,
      targetId: () => contentItemId,
      payload: {
        nodeId,
        contentItemId,
      },
      operation: () => this.contentOpsService.detachContentItemFromNode(nodeId, contentItemId),
    });
  }

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.CONTENT_EDITOR, AdminRole.CONTENT_PUBLISHER)
  @Post('textbooks/nodes/:nodeId/knowledge-points')
  async attachKnowledgePointToNode(
    @CurrentAdminContext() currentAdmin: CurrentAdmin,
    @Param('nodeId') nodeId: string,
    @Body() payload: AttachKnowledgePointToNodeDto,
  ) {
    return this.withAudit(currentAdmin, {
      action: 'NODE_KNOWLEDGE_POINT_ATTACHED',
      targetType: 'TEXTBOOK_NODE_KNOWLEDGE_POINT',
      summary: () => `挂载知识点到目录节点 ${nodeId}`,
      targetId: (result) => result.id,
      payload: {
        nodeId,
        knowledgePointId: payload.knowledgePointId,
      },
      operation: () => this.contentOpsService.attachKnowledgePointToNode(nodeId, payload),
    });
  }

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.CONTENT_EDITOR, AdminRole.CONTENT_PUBLISHER)
  @Delete('textbooks/nodes/:nodeId/knowledge-points/:knowledgePointId')
  async detachKnowledgePointFromNode(
    @CurrentAdminContext() currentAdmin: CurrentAdmin,
    @Param('nodeId') nodeId: string,
    @Param('knowledgePointId') knowledgePointId: string,
  ) {
    return this.withAudit(currentAdmin, {
      action: 'NODE_KNOWLEDGE_POINT_DETACHED',
      targetType: 'TEXTBOOK_NODE_KNOWLEDGE_POINT',
      summary: () => `解绑目录节点知识点 ${knowledgePointId}`,
      targetId: () => knowledgePointId,
      payload: {
        nodeId,
        knowledgePointId,
      },
      operation: () => this.contentOpsService.detachKnowledgePointFromNode(nodeId, knowledgePointId),
    });
  }

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.CONTENT_PUBLISHER)
  @Post('content-items/:contentItemId/publish')
  async publishContentItemVersion(
    @CurrentAdminContext() currentAdmin: CurrentAdmin,
    @Param('contentItemId') contentItemId: string,
    @Body() payload: PublishContentItemVersionDto,
  ) {
    return this.withAudit(currentAdmin, {
      action: 'CONTENT_ITEM_VERSION_PUBLISHED',
      targetType: 'CONTENT_ITEM_VERSION',
      summary: () => `发布内容版本 ${payload.versionId}`,
      targetId: () => payload.versionId,
      payload: {
        contentItemId,
        versionId: payload.versionId,
      },
      operation: () => this.contentOpsService.publishContentItemVersion(contentItemId, payload),
    });
  }

  private async withAudit<T>(
    currentAdmin: CurrentAdmin,
    options: {
      action: string;
      targetType: string;
      summary: (result: T) => string;
      targetId: (result: T) => string | null | undefined;
      payload?: Record<string, unknown>;
      operation: () => Promise<T>;
    },
  ): Promise<T> {
    const result = await options.operation();
    await this.adminAuditService.recordLog({
      adminUserId: currentAdmin.adminUserId,
      action: options.action,
      targetType: options.targetType,
      targetId: options.targetId(result) ?? null,
      summary: options.summary(result),
      payload: options.payload,
    });
    return result;
  }
}
