import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ReviewStatus } from '@prisma/client';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { SubjectsService } from '../subjects/subjects.service';
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

@Injectable()
export class ContentOpsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly subjectsService: SubjectsService,
  ) {}

  async createPublisher(payload: CreatePublisherDto) {
    try {
      const publisher = await this.prismaService.publisher.create({
        data: {
          code: payload.code.trim(),
          name: payload.name.trim(),
          shortName: payload.shortName?.trim() ?? null,
          region: payload.region?.trim() ?? null,
          isEnabled: payload.isEnabled ?? true,
        },
      });

      return {
        id: publisher.id,
        code: publisher.code,
        name: publisher.name,
      };
    } catch (error) {
      this.rethrowConflict(error, 'publisher already exists');
      throw error;
    }
  }

  async createTextbookEdition(payload: CreateTextbookEditionDto) {
    const subject = await this.subjectsService.getSubjectByCode(payload.subjectCode);
    const publisher = await this.prismaService.publisher.findUnique({
      where: {
        code: payload.publisherCode.trim(),
      },
    });
    if (!publisher) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'publisher not found',
        details: {},
      });
    }

    try {
      const edition = await this.prismaService.textbookEdition.create({
        data: {
          subjectId: subject.id,
          publisherId: publisher.id,
          code: payload.code.trim(),
          displayName: payload.displayName.trim(),
          curriculumYear: payload.curriculumYear ?? null,
          regionScope: payload.regionScope?.trim() ?? null,
          isEnabled: payload.isEnabled ?? true,
        },
      });

      return {
        id: edition.id,
        code: edition.code,
        displayName: edition.displayName,
      };
    } catch (error) {
      this.rethrowConflict(error, 'textbook edition already exists');
      throw error;
    }
  }

  async createTextbookVolume(editionId: string, payload: CreateTextbookVolumeDto) {
    await this.assertEditionExists(editionId);
    try {
      const volume = await this.prismaService.textbookVolume.create({
        data: {
          editionId,
          grade: payload.grade,
          semester: payload.semester,
          volumeLabel: payload.volumeLabel.trim(),
          k12Stage: payload.k12Stage,
          sortOrder: payload.sortOrder ?? 0,
          version: payload.version ?? 1,
          reviewStatus: ReviewStatus.DRAFT,
        },
      });

      return {
        id: volume.id,
        editionId: volume.editionId,
        grade: volume.grade,
        semester: volume.semester,
        volumeLabel: volume.volumeLabel,
      };
    } catch (error) {
      this.rethrowConflict(error, 'textbook volume already exists');
      throw error;
    }
  }

  async createTextbookNode(volumeId: string, payload: CreateTextbookNodeDto) {
    const volume = await this.prismaService.textbookVolume.findUnique({
      where: {
        id: volumeId,
      },
    });
    if (!volume) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'textbook volume not found',
        details: {},
      });
    }

    let depth = 1;
    if (payload.parentId) {
      const parent = await this.prismaService.textbookNode.findFirst({
        where: {
          id: payload.parentId,
          volumeId,
        },
      });
      if (!parent) {
        throw new NotFoundException({
          code: 'NOT_FOUND',
          message: 'parent textbook node not found',
          details: {},
        });
      }
      depth = parent.depth + 1;
    }

    const node = await this.prismaService.textbookNode.create({
      data: {
        volumeId,
        parentId: payload.parentId ?? null,
        nodeType: payload.nodeType,
        nodeCode: payload.nodeCode?.trim() ?? null,
        title: payload.title.trim(),
        description: payload.description?.trim() ?? null,
        depth,
        sortOrder: payload.sortOrder ?? 0,
        reviewStatus: ReviewStatus.DRAFT,
        isLeaf: payload.isLeaf ?? false,
        metadataJson: payload.metadata
          ? (payload.metadata as Prisma.InputJsonValue)
          : undefined,
      },
    });

    return {
      id: node.id,
      volumeId: node.volumeId,
      parentId: node.parentId,
      title: node.title,
      depth: node.depth,
    };
  }

  async updateTextbookNode(nodeId: string, payload: UpdateTextbookNodeDto) {
    const currentNode = await this.prismaService.textbookNode.findUnique({
      where: {
        id: nodeId,
      },
      select: {
        id: true,
        volumeId: true,
        parentId: true,
        depth: true,
      },
    });

    if (!currentNode) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'textbook node not found',
        details: {},
      });
    }

    let nextParentId = currentNode.parentId;
    let nextDepth = currentNode.depth;

    if ('parentId' in payload) {
      if (!payload.parentId) {
        nextParentId = null;
        nextDepth = 1;
      } else {
        if (payload.parentId === nodeId) {
          throw new BadRequestException({
            code: 'INVALID_REQUEST',
            message: 'textbook node cannot be parent of itself',
            details: {},
          });
        }

        const parentNode = await this.prismaService.textbookNode.findFirst({
          where: {
            id: payload.parentId,
            volumeId: currentNode.volumeId,
          },
          select: {
            id: true,
            depth: true,
          },
        });

        if (!parentNode) {
          throw new NotFoundException({
            code: 'NOT_FOUND',
            message: 'parent textbook node not found',
            details: {},
          });
        }

        const volumeNodes = await this.prismaService.textbookNode.findMany({
          where: {
            volumeId: currentNode.volumeId,
          },
          select: {
            id: true,
            parentId: true,
            depth: true,
          },
        });

        const subtreeIds = this.collectSubtreeIds(volumeNodes, nodeId);
        if (subtreeIds.includes(payload.parentId)) {
          throw new BadRequestException({
            code: 'INVALID_REQUEST',
            message: 'textbook node cannot be moved under its descendant',
            details: {},
          });
        }

        nextParentId = parentNode.id;
        nextDepth = parentNode.depth + 1;
      }
    }

    const depthDelta = nextDepth - currentNode.depth;

    const node = await this.prismaService.$transaction(async (prisma) => {
      const updatedNode = await prisma.textbookNode.update({
        where: {
          id: nodeId,
        },
        data: {
          ...(!('parentId' in payload) ? {} : { parentId: nextParentId, depth: nextDepth }),
          ...(payload.nodeType === undefined ? {} : { nodeType: payload.nodeType }),
          ...(payload.nodeCode === undefined ? {} : { nodeCode: payload.nodeCode.trim() || null }),
          ...(payload.title === undefined ? {} : { title: payload.title.trim() }),
          ...(payload.description === undefined ? {} : { description: payload.description.trim() || null }),
          ...(payload.sortOrder === undefined ? {} : { sortOrder: payload.sortOrder }),
          ...(payload.isLeaf === undefined ? {} : { isLeaf: payload.isLeaf }),
          ...(payload.metadata === undefined
            ? {}
            : {
                metadataJson: payload.metadata as Prisma.InputJsonValue,
              }),
        },
      });

      if (depthDelta !== 0) {
        const volumeNodes = await prisma.textbookNode.findMany({
          where: {
            volumeId: currentNode.volumeId,
          },
          select: {
            id: true,
            parentId: true,
            depth: true,
          },
        });
        const subtreeIds = this.collectSubtreeIds(volumeNodes, nodeId).filter((id) => id !== nodeId);

        for (const descendantId of subtreeIds) {
          const descendant = volumeNodes.find((item) => item.id === descendantId);
          if (!descendant) {
            continue;
          }

          await prisma.textbookNode.update({
            where: {
              id: descendantId,
            },
            data: {
              depth: descendant.depth + depthDelta,
            },
          });
        }
      }

      return updatedNode;
    });

    return {
      id: node.id,
      volumeId: node.volumeId,
      parentId: node.parentId,
      title: node.title,
      nodeType: node.nodeType,
      nodeCode: node.nodeCode,
      description: node.description,
      sortOrder: node.sortOrder,
      isLeaf: node.isLeaf,
      depth: node.depth,
    };
  }

  async deleteTextbookNode(nodeId: string) {
    await this.assertNodeExists(nodeId);
    await this.prismaService.textbookNode.delete({
      where: {
        id: nodeId,
      },
    });

    return {
      nodeId,
      deleted: true,
    };
  }

  async createKnowledgePoint(payload: CreateKnowledgePointDto) {
    const subject = await this.subjectsService.getSubjectByCode(payload.subjectCode);
    try {
      const knowledgePoint = await this.prismaService.knowledgePoint.create({
        data: {
          subjectId: subject.id,
          code: payload.code.trim(),
          name: payload.name.trim(),
          description: payload.description?.trim() ?? null,
          difficultyLevel: payload.difficultyLevel ?? 1,
          k12Stage: payload.k12Stage ?? null,
          tagsJson: payload.tags ? (payload.tags as Prisma.InputJsonValue) : undefined,
        },
      });

      return {
        id: knowledgePoint.id,
        code: knowledgePoint.code,
        name: knowledgePoint.name,
      };
    } catch (error) {
      this.rethrowConflict(error, 'knowledge point already exists');
      throw error;
    }
  }

  async updateKnowledgePoint(knowledgePointId: string, payload: UpdateKnowledgePointDto) {
    const existing = await this.prismaService.knowledgePoint.findUnique({
      where: {
        id: knowledgePointId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'knowledge point not found',
        details: {},
      });
    }

    try {
      const knowledgePoint = await this.prismaService.knowledgePoint.update({
        where: {
          id: knowledgePointId,
        },
        data: {
          ...(payload.code === undefined ? {} : { code: payload.code.trim() }),
          ...(payload.name === undefined ? {} : { name: payload.name.trim() }),
          ...(payload.description === undefined ? {} : { description: payload.description.trim() || null }),
          ...(payload.difficultyLevel === undefined ? {} : { difficultyLevel: payload.difficultyLevel }),
          ...(payload.k12Stage === undefined ? {} : { k12Stage: payload.k12Stage }),
          ...(payload.tags === undefined ? {} : { tagsJson: payload.tags as Prisma.InputJsonValue }),
          ...(payload.isEnabled === undefined ? {} : { isEnabled: payload.isEnabled }),
        },
      });

      return {
        id: knowledgePoint.id,
        code: knowledgePoint.code,
        name: knowledgePoint.name,
        difficultyLevel: knowledgePoint.difficultyLevel,
        k12Stage: knowledgePoint.k12Stage,
        isEnabled: knowledgePoint.isEnabled,
      };
    } catch (error) {
      this.rethrowConflict(error, 'knowledge point already exists');
      throw error;
    }
  }

  async createContentItem(payload: CreateContentItemDto) {
    const subject = await this.subjectsService.getSubjectByCode(payload.subjectCode);
    const contentItem = await this.prismaService.contentItem.create({
      data: {
        subjectId: subject.id,
        itemType: payload.itemType,
        canonicalKey: payload.canonicalKey?.trim() ?? null,
        title: payload.title.trim(),
        summary: payload.summary?.trim() ?? null,
        difficultyLevel: payload.difficultyLevel ?? 1,
        k12Stage: payload.k12Stage ?? null,
        isReusable: payload.isReusable ?? true,
      },
    });

    return {
      id: contentItem.id,
      title: contentItem.title,
      itemType: contentItem.itemType,
    };
  }

  async createContentItemVersion(contentItemId: string, payload: CreateContentItemVersionDto) {
    const contentItem = await this.prismaService.contentItem.findUnique({
      where: {
        id: contentItemId,
      },
      select: {
        id: true,
      },
    });
    if (!contentItem) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'content item not found',
        details: {},
      });
    }

    const latestVersion = await this.prismaService.contentItemVersion.findFirst({
      where: {
        contentItemId,
      },
      orderBy: [{ version: 'desc' }],
      select: {
        version: true,
      },
    });

    const version = await this.prismaService.contentItemVersion.create({
      data: {
        contentItemId,
        version: (latestVersion?.version ?? 0) + 1,
        reviewStatus: ReviewStatus.DRAFT,
        title: payload.title.trim(),
        payloadJson: payload.payload as Prisma.InputJsonValue,
        changeSummary: payload.changeSummary?.trim() ?? null,
      },
    });

    return {
      id: version.id,
      contentItemId: version.contentItemId,
      version: version.version,
      reviewStatus: version.reviewStatus,
    };
  }

  async attachContentItemToNode(nodeId: string, payload: AttachContentItemToNodeDto) {
    const node = await this.prismaService.textbookNode.findUnique({
      where: {
        id: nodeId,
      },
      select: {
        id: true,
      },
    });
    if (!node) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'textbook node not found',
        details: {},
      });
    }

    const contentItem = await this.prismaService.contentItem.findUnique({
      where: {
        id: payload.contentItemId,
      },
      select: {
        id: true,
      },
    });
    if (!contentItem) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'content item not found',
        details: {},
      });
    }

    if (payload.contentVersionId) {
      const version = await this.prismaService.contentItemVersion.findFirst({
        where: {
          id: payload.contentVersionId,
          contentItemId: payload.contentItemId,
        },
        select: {
          id: true,
        },
      });
      if (!version) {
        throw new NotFoundException({
          code: 'NOT_FOUND',
          message: 'content version not found',
          details: {},
        });
      }
    }

    try {
      const link = await this.prismaService.textbookNodeContentItem.create({
        data: {
          textbookNodeId: nodeId,
          contentItemId: payload.contentItemId,
          contentVersionId: payload.contentVersionId ?? null,
          isPrimary: payload.isPrimary ?? false,
          sortOrder: payload.sortOrder ?? 0,
          metadataJson: payload.metadata
            ? (payload.metadata as Prisma.InputJsonValue)
            : undefined,
        },
      });

      return {
        id: link.id,
        textbookNodeId: link.textbookNodeId,
        contentItemId: link.contentItemId,
      };
    } catch (error) {
      this.rethrowConflict(error, 'content item already attached to textbook node');
      throw error;
    }
  }

  async detachContentItemFromNode(nodeId: string, contentItemId: string) {
    await this.assertNodeExists(nodeId);
    const deleted = await this.prismaService.textbookNodeContentItem.deleteMany({
      where: {
        textbookNodeId: nodeId,
        contentItemId,
      },
    });

    if (deleted.count === 0) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'textbook node content item link not found',
        details: {},
      });
    }

    return {
      textbookNodeId: nodeId,
      contentItemId,
      deleted: true,
    };
  }

  async attachKnowledgePointToNode(nodeId: string, payload: AttachKnowledgePointToNodeDto) {
    const node = await this.prismaService.textbookNode.findUnique({
      where: {
        id: nodeId,
      },
      select: {
        id: true,
      },
    });
    if (!node) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'textbook node not found',
        details: {},
      });
    }

    const knowledgePoint = await this.prismaService.knowledgePoint.findUnique({
      where: {
        id: payload.knowledgePointId,
      },
      select: {
        id: true,
      },
    });
    if (!knowledgePoint) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'knowledge point not found',
        details: {},
      });
    }

    try {
      const link = await this.prismaService.textbookNodeKnowledgePoint.create({
        data: {
          textbookNodeId: nodeId,
          knowledgePointId: payload.knowledgePointId,
          relationType: payload.relationType?.trim() ?? null,
          sortOrder: payload.sortOrder ?? 0,
        },
      });

      return {
        id: link.id,
        textbookNodeId: link.textbookNodeId,
        knowledgePointId: link.knowledgePointId,
      };
    } catch (error) {
      this.rethrowConflict(error, 'knowledge point already attached to textbook node');
      throw error;
    }
  }

  async detachKnowledgePointFromNode(nodeId: string, knowledgePointId: string) {
    await this.assertNodeExists(nodeId);
    const deleted = await this.prismaService.textbookNodeKnowledgePoint.deleteMany({
      where: {
        textbookNodeId: nodeId,
        knowledgePointId,
      },
    });

    if (deleted.count === 0) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'textbook node knowledge point link not found',
        details: {},
      });
    }

    return {
      textbookNodeId: nodeId,
      knowledgePointId,
      deleted: true,
    };
  }

  async publishContentItemVersion(contentItemId: string, payload: PublishContentItemVersionDto) {
    const version = await this.prismaService.contentItemVersion.findFirst({
      where: {
        id: payload.versionId,
        contentItemId,
      },
      select: {
        id: true,
        version: true,
      },
    });
    if (!version) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'content version not found',
        details: {},
      });
    }

    await this.prismaService.$transaction(async (prisma) => {
      await prisma.contentItemVersion.updateMany({
        where: {
          contentItemId,
          reviewStatus: ReviewStatus.PUBLISHED,
        },
        data: {
          reviewStatus: ReviewStatus.OFFLINE,
        },
      });

      await prisma.contentItemVersion.update({
        where: {
          id: version.id,
        },
        data: {
          reviewStatus: ReviewStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      });

      await prisma.contentItem.update({
        where: {
          id: contentItemId,
        },
        data: {
          currentVersion: version.version,
          currentVersionId: version.id,
        },
      });
    });

    return {
      contentItemId,
      versionId: version.id,
      reviewStatus: ReviewStatus.PUBLISHED,
    };
  }

  private async assertEditionExists(editionId: string): Promise<void> {
    const edition = await this.prismaService.textbookEdition.findUnique({
      where: {
        id: editionId,
      },
      select: {
        id: true,
      },
    });

    if (!edition) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'textbook edition not found',
        details: {},
      });
    }
  }

  private async assertNodeExists(nodeId: string): Promise<void> {
    const node = await this.prismaService.textbookNode.findUnique({
      where: {
        id: nodeId,
      },
      select: {
        id: true,
      },
    });

    if (!node) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'textbook node not found',
        details: {},
      });
    }
  }

  private collectSubtreeIds(
    nodes: Array<{ id: string; parentId: string | null }>,
    rootNodeId: string,
  ): string[] {
    const childMap = new Map<string | null, string[]>();
    for (const node of nodes) {
      const children = childMap.get(node.parentId) ?? [];
      children.push(node.id);
      childMap.set(node.parentId, children);
    }

    const result: string[] = [];
    const queue = [rootNodeId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId) {
        continue;
      }

      result.push(currentId);
      const children = childMap.get(currentId) ?? [];
      queue.push(...children);
    }

    return result;
  }

  private rethrowConflict(error: unknown, message: string): never | void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      throw new ConflictException({
        code: 'CONFLICT',
        message,
        details: {},
      });
    }
  }
}
