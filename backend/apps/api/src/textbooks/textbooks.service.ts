import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ContentItemType,
  K12Stage,
  ReviewStatus,
  SemesterType,
  SubjectCode,
  TextbookNodeType,
} from '@prisma/client';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { SubjectsService } from '../subjects/subjects.service';

type TreeNodeRecord = {
  id: string;
  parentId: string | null;
  nodeType: TextbookNodeType;
  nodeCode: string | null;
  title: string;
  depth: number;
  sortOrder: number;
  isLeaf: boolean;
  metadata?: Record<string, unknown> | null;
  children: TreeNodeRecord[];
};

export interface TextbookEditionRecord {
  id: string;
  subjectId: string;
  subjectCode: SubjectCode;
  publisherId: string;
  publisherName: string;
  code: string;
  displayName: string;
  regionScope: string | null;
  isEnabled: boolean;
}

export interface TextbookEditionDetailRecord extends TextbookEditionRecord {
  curriculumYear: number | null;
  validFrom: string | null;
  validTo: string | null;
}

export interface TextbookVolumeRecord {
  id: string;
  editionId: string;
  grade: number;
  semester: SemesterType;
  volumeLabel: string;
  k12Stage: K12Stage;
  version: number;
  reviewStatus: ReviewStatus;
  publishedAt: string | null;
}

export interface TextbookVolumeDetailRecord extends TextbookVolumeRecord {
  editionDisplayName: string;
}

export interface TextbookTreeRecord {
  volume: {
    id: string;
    volumeLabel: string;
  };
  nodes: TreeNodeRecord[];
}

export interface TextbookNodeRecord {
  id: string;
  volumeId: string;
  parentId: string | null;
  nodeType: TextbookNodeType;
  nodeCode: string | null;
  title: string;
  description: string | null;
  depth: number;
  sortOrder: number;
  isLeaf: boolean;
  metadata: Record<string, unknown> | null;
}

export interface NodeContentItemRecord {
  id: string;
  itemType: ContentItemType;
  title: string;
  difficultyLevel: number;
  k12Stage: K12Stage | null;
  isPrimary: boolean;
  contentVersionId: string | null;
  version: number | null;
  reviewStatus: ReviewStatus | null;
}

export interface KnowledgePointRecord {
  id: string;
  subjectCode: SubjectCode;
  code: string;
  name: string;
  description: string | null;
  difficultyLevel: number;
  k12Stage: K12Stage | null;
  isEnabled: boolean;
  tags: Record<string, unknown> | null;
}

@Injectable()
export class TextbooksService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly subjectsService: SubjectsService,
  ) {}

  async listEditions(filters: {
    subjectCode?: SubjectCode;
    grade?: number;
    enabled?: boolean;
  }): Promise<TextbookEditionRecord[]> {
    let subjectId: string | undefined;
    if (filters.subjectCode) {
      subjectId = (await this.subjectsService.getSubjectByCode(filters.subjectCode)).id;
    }

    const editions = await this.prismaService.textbookEdition.findMany({
      where: {
        ...(subjectId ? { subjectId } : {}),
        ...(filters.enabled === undefined ? {} : { isEnabled: filters.enabled }),
        ...(filters.grade !== undefined
          ? {
              volumes: {
                some: {
                  grade: filters.grade,
                },
              },
            }
          : {}),
      },
      include: {
        subject: true,
        publisher: true,
      },
      orderBy: [{ displayName: 'asc' }, { createdAt: 'asc' }],
    });

    return editions.map((edition) => ({
      id: edition.id,
      subjectId: edition.subjectId,
      subjectCode: edition.subject.code,
      publisherId: edition.publisherId,
      publisherName: edition.publisher.name,
      code: edition.code,
      displayName: edition.displayName,
      regionScope: edition.regionScope,
      isEnabled: edition.isEnabled,
    }));
  }

  async getEdition(editionId: string): Promise<TextbookEditionDetailRecord> {
    const edition = await this.prismaService.textbookEdition.findUnique({
      where: { id: editionId },
      include: {
        subject: true,
        publisher: true,
      },
    });

    if (!edition) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'textbook edition not found',
        details: {},
      });
    }

    return {
      id: edition.id,
      subjectId: edition.subjectId,
      subjectCode: edition.subject.code,
      publisherId: edition.publisherId,
      publisherName: edition.publisher.name,
      code: edition.code,
      displayName: edition.displayName,
      regionScope: edition.regionScope,
      isEnabled: edition.isEnabled,
      curriculumYear: edition.curriculumYear,
      validFrom: edition.validFrom?.toISOString() ?? null,
      validTo: edition.validTo?.toISOString() ?? null,
    };
  }

  async listVolumes(
    editionId: string,
    filters: {
      grade?: number;
      semester?: SemesterType;
      publishedOnly?: boolean;
    },
  ): Promise<TextbookVolumeRecord[]> {
    await this.assertEditionExists(editionId);
    const publishedOnly = filters.publishedOnly ?? true;
    const volumes = await this.prismaService.textbookVolume.findMany({
      where: {
        editionId,
        ...(filters.grade !== undefined ? { grade: filters.grade } : {}),
        ...(filters.semester ? { semester: filters.semester } : {}),
        ...(publishedOnly ? { reviewStatus: ReviewStatus.PUBLISHED } : {}),
      },
      orderBy: [{ grade: 'asc' }, { semester: 'asc' }, { version: 'desc' }, { createdAt: 'asc' }],
    });

    return volumes.map((volume) => this.toTextbookVolumeRecord(volume));
  }

  async getVolume(volumeId: string): Promise<TextbookVolumeDetailRecord> {
    const volume = await this.prismaService.textbookVolume.findUnique({
      where: { id: volumeId },
      include: {
        edition: true,
      },
    });

    if (!volume) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'textbook volume not found',
        details: {},
      });
    }

    return {
      ...this.toTextbookVolumeRecord(volume),
      editionDisplayName: volume.edition.displayName,
    };
  }

  async getVolumeTree(
    volumeId: string,
    filters: {
      depth?: number;
      nodeType?: TextbookNodeType;
    },
  ): Promise<TextbookTreeRecord> {
    const volume = await this.prismaService.textbookVolume.findUnique({
      where: { id: volumeId },
      select: {
        id: true,
        volumeLabel: true,
      },
    });

    if (!volume) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'textbook volume not found',
        details: {},
      });
    }

    const nodes = await this.prismaService.textbookNode.findMany({
      where: {
        volumeId,
        ...(filters.depth !== undefined ? { depth: { lte: filters.depth } } : {}),
      },
      orderBy: [{ depth: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    const tree = this.buildTree(nodes.map((node) => this.toTreeNodeRecord(node)));
    return {
      volume,
      nodes: filters.nodeType ? this.filterTreeByNodeType(tree, filters.nodeType) : tree,
    };
  }

  async getNode(nodeId: string): Promise<TextbookNodeRecord> {
    const node = await this.prismaService.textbookNode.findUnique({
      where: { id: nodeId },
    });

    if (!node) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'textbook node not found',
        details: {},
      });
    }

    return this.toTextbookNodeRecord(node);
  }

  async listNodeContentItems(
    nodeId: string,
    filters: {
      itemType?: ContentItemType;
      includeDraft?: boolean;
      limit?: number;
    },
  ): Promise<NodeContentItemRecord[]> {
    await this.assertNodeExists(nodeId);
    const includeDraft = filters.includeDraft ?? false;
    const links = await this.prismaService.textbookNodeContentItem.findMany({
      where: {
        textbookNodeId: nodeId,
        ...(filters.itemType ? { contentItem: { itemType: filters.itemType } } : {}),
      },
      include: {
        contentItem: true,
        contentVersion: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      take: filters.limit,
    });

    const records = await Promise.all(
      links.map(async (link) => {
        const effectiveVersion =
          link.contentVersion ??
          (await this.prismaService.contentItemVersion.findFirst({
            where: {
              contentItemId: link.contentItemId,
              ...(includeDraft ? {} : { reviewStatus: ReviewStatus.PUBLISHED }),
            },
            orderBy: [{ version: 'desc' }, { createdAt: 'desc' }],
          }));

        if (!includeDraft && !effectiveVersion) {
          return null;
        }

        if (!includeDraft && effectiveVersion?.reviewStatus !== ReviewStatus.PUBLISHED) {
          return null;
        }

        return {
          id: link.contentItem.id,
          itemType: link.contentItem.itemType,
          title: link.contentItem.title,
          difficultyLevel: link.contentItem.difficultyLevel,
          k12Stage: link.contentItem.k12Stage,
          isPrimary: link.isPrimary,
          contentVersionId: effectiveVersion?.id ?? null,
          version: effectiveVersion?.version ?? null,
          reviewStatus: effectiveVersion?.reviewStatus ?? null,
        } satisfies NodeContentItemRecord;
      }),
    );

    return records.filter((record): record is NodeContentItemRecord => Boolean(record));
  }

  async listKnowledgePoints(filters: {
    subjectCode?: SubjectCode;
    k12Stage?: K12Stage;
    keyword?: string;
    enabled?: boolean;
  }): Promise<KnowledgePointRecord[]> {
    let subjectId: string | undefined;
    if (filters.subjectCode) {
      subjectId = (await this.subjectsService.getSubjectByCode(filters.subjectCode)).id;
    }

    const knowledgePoints = await this.prismaService.knowledgePoint.findMany({
      where: {
        ...(subjectId ? { subjectId } : {}),
        ...(filters.k12Stage ? { k12Stage: filters.k12Stage } : {}),
        ...(filters.enabled === undefined ? {} : { isEnabled: filters.enabled }),
        ...(filters.keyword
          ? {
              OR: [
                { code: { contains: filters.keyword, mode: 'insensitive' } },
                { name: { contains: filters.keyword, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        subject: true,
      },
      orderBy: [{ difficultyLevel: 'asc' }, { code: 'asc' }],
    });

    return knowledgePoints.map((knowledgePoint) => ({
      id: knowledgePoint.id,
      subjectCode: knowledgePoint.subject.code,
      code: knowledgePoint.code,
      name: knowledgePoint.name,
      description: knowledgePoint.description,
      difficultyLevel: knowledgePoint.difficultyLevel,
      k12Stage: knowledgePoint.k12Stage,
      isEnabled: knowledgePoint.isEnabled,
      tags: (knowledgePoint.tagsJson as Record<string, unknown> | null) ?? null,
    }));
  }

  async getNodeKnowledgePoints(nodeId: string): Promise<KnowledgePointRecord[]> {
    await this.assertNodeExists(nodeId);
    const links = await this.prismaService.textbookNodeKnowledgePoint.findMany({
      where: {
        textbookNodeId: nodeId,
      },
      include: {
        knowledgePoint: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return links.map((link) => ({
      id: link.knowledgePoint.id,
      subjectCode: link.knowledgePoint.subject.code,
      code: link.knowledgePoint.code,
      name: link.knowledgePoint.name,
      description: link.knowledgePoint.description,
      difficultyLevel: link.knowledgePoint.difficultyLevel,
      k12Stage: link.knowledgePoint.k12Stage,
      isEnabled: link.knowledgePoint.isEnabled,
      tags: (link.knowledgePoint.tagsJson as Record<string, unknown> | null) ?? null,
    }));
  }

  private async assertEditionExists(editionId: string): Promise<void> {
    const edition = await this.prismaService.textbookEdition.findUnique({
      where: { id: editionId },
      select: { id: true },
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
      where: { id: nodeId },
      select: { id: true },
    });
    if (!node) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'textbook node not found',
        details: {},
      });
    }
  }

  private toTextbookVolumeRecord(volume: {
    id: string;
    editionId: string;
    grade: number;
    semester: SemesterType;
    volumeLabel: string;
    k12Stage: K12Stage;
    version: number;
    reviewStatus: ReviewStatus;
    publishedAt: Date | null;
  }): TextbookVolumeRecord {
    return {
      id: volume.id,
      editionId: volume.editionId,
      grade: volume.grade,
      semester: volume.semester,
      volumeLabel: volume.volumeLabel,
      k12Stage: volume.k12Stage,
      version: volume.version,
      reviewStatus: volume.reviewStatus,
      publishedAt: volume.publishedAt?.toISOString() ?? null,
    };
  }

  private toTreeNodeRecord(node: {
    id: string;
    parentId: string | null;
    nodeType: TextbookNodeType;
    nodeCode: string | null;
    title: string;
    depth: number;
    sortOrder: number;
    isLeaf: boolean;
    metadataJson: unknown;
  }): TreeNodeRecord {
    return {
      id: node.id,
      parentId: node.parentId,
      nodeType: node.nodeType,
      nodeCode: node.nodeCode,
      title: node.title,
      depth: node.depth,
      sortOrder: node.sortOrder,
      isLeaf: node.isLeaf,
      metadata: this.asObject(node.metadataJson),
      children: [],
    };
  }

  private toTextbookNodeRecord(node: {
    id: string;
    volumeId: string;
    parentId: string | null;
    nodeType: TextbookNodeType;
    nodeCode: string | null;
    title: string;
    description: string | null;
    depth: number;
    sortOrder: number;
    isLeaf: boolean;
    metadataJson: unknown;
  }): TextbookNodeRecord {
    return {
      id: node.id,
      volumeId: node.volumeId,
      parentId: node.parentId,
      nodeType: node.nodeType,
      nodeCode: node.nodeCode,
      title: node.title,
      description: node.description,
      depth: node.depth,
      sortOrder: node.sortOrder,
      isLeaf: node.isLeaf,
      metadata: this.asObject(node.metadataJson),
    };
  }

  private buildTree(nodes: TreeNodeRecord[]): TreeNodeRecord[] {
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    const roots: TreeNodeRecord[] = [];

    for (const node of nodes) {
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)?.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  private filterTreeByNodeType(nodes: TreeNodeRecord[], nodeType: TextbookNodeType): TreeNodeRecord[] {
    const nextNodes: TreeNodeRecord[] = [];

    for (const node of nodes) {
      const filteredChildren = this.filterTreeByNodeType(node.children, nodeType);
      if (node.nodeType === nodeType || filteredChildren.length > 0) {
        nextNodes.push({
          ...node,
          children: filteredChildren,
        });
      }
    }

    return nextNodes;
  }

  private asObject(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  }
}
