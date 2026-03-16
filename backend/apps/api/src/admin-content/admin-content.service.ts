import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentItemType, ReviewStatus, SubjectCode } from '@prisma/client';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { SubjectsService } from '../subjects/subjects.service';

export interface AdminContentItemRecord {
  id: string;
  subjectCode: SubjectCode;
  itemType: ContentItemType;
  canonicalKey: string | null;
  title: string;
  summary: string | null;
  difficultyLevel: number;
  k12Stage: string | null;
  isReusable: boolean;
  currentVersion: number;
  currentVersionId: string | null;
  currentReviewStatus: ReviewStatus | null;
  versionCount: number;
  updatedAt: string;
}

export interface AdminContentItemVersionRecord {
  id: string;
  version: number;
  reviewStatus: ReviewStatus;
  title: string;
  changeSummary: string | null;
  publishedAt: string | null;
  updatedAt: string;
}

@Injectable()
export class AdminContentService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly subjectsService: SubjectsService,
  ) {}

  async listContentItems(filters: {
    subjectCode?: SubjectCode;
    itemType?: ContentItemType;
    reviewStatus?: ReviewStatus;
    limit?: number;
  }): Promise<AdminContentItemRecord[]> {
    let subjectId: string | undefined;
    if (filters.subjectCode) {
      subjectId = (await this.subjectsService.getSubjectByCode(filters.subjectCode)).id;
    }

    const contentItems = await this.prismaService.contentItem.findMany({
      where: {
        ...(subjectId ? { subjectId } : {}),
        ...(filters.itemType ? { itemType: filters.itemType } : {}),
      },
      include: {
        subject: true,
        versions: {
          where: filters.reviewStatus ? { reviewStatus: filters.reviewStatus } : undefined,
          orderBy: [{ version: 'desc' }],
          take: 1,
        },
        _count: {
          select: {
            versions: true,
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      take: filters.limit ?? 50,
    });

    return contentItems
      .filter((item) => {
        if (!filters.reviewStatus) {
          return true;
        }
        return item.versions.length > 0;
      })
      .map((item) => ({
        id: item.id,
        subjectCode: item.subject.code,
        itemType: item.itemType,
        canonicalKey: item.canonicalKey,
        title: item.title,
        summary: item.summary,
        difficultyLevel: item.difficultyLevel,
        k12Stage: item.k12Stage,
        isReusable: item.isReusable,
        currentVersion: item.currentVersion,
        currentVersionId: item.currentVersionId,
        currentReviewStatus: item.versions[0]?.reviewStatus ?? null,
        versionCount: item._count.versions,
        updatedAt: item.updatedAt.toISOString(),
      }));
  }

  async listContentItemVersions(contentItemId: string): Promise<AdminContentItemVersionRecord[]> {
    const contentItem = await this.prismaService.contentItem.findUnique({
      where: { id: contentItemId },
      select: { id: true },
    });

    if (!contentItem) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'content item not found',
        details: {},
      });
    }

    const versions = await this.prismaService.contentItemVersion.findMany({
      where: {
        contentItemId,
      },
      orderBy: [{ version: 'desc' }, { createdAt: 'desc' }],
    });

    return versions.map((version) => ({
      id: version.id,
      version: version.version,
      reviewStatus: version.reviewStatus,
      title: version.title,
      changeSummary: version.changeSummary,
      publishedAt: version.publishedAt?.toISOString() ?? null,
      updatedAt: version.updatedAt.toISOString(),
    }));
  }
}
