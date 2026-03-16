import { Injectable } from '@nestjs/common';
import { ReviewStatus } from '@prisma/client';
import { ACCESS_TOKEN_EXPIRES_IN, VERIFICATION_CODE_EXPIRES_IN_SEC } from '../auth/auth.constants';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { DEFAULT_CHILD_LEARNING_SETTINGS_SUMMARY } from '../platform-config/platform-config.constants';

@Injectable()
export class AdminOverviewService {
  constructor(private readonly prismaService: PrismaService) {}

  async getOverview() {
    const now = new Date();
    const last7DaysStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previous7DaysStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const reviewStatusCounts = Object.fromEntries(
      Object.values(ReviewStatus).map((status) => [status, 0]),
    ) as Record<ReviewStatus, number>;

    const [
      adminUserCount,
      textbookEditionCount,
      textbookVolumeCount,
      textbookNodeCount,
      knowledgePointCount,
      enabledKnowledgePointCount,
      contentItemCount,
      publishedContentVersionCount,
      contentVersionCounts,
      last7DaysTotalChanges,
      previous7DaysTotalChanges,
      last7DaysPublishes,
      previous7DaysPublishes,
      subjects,
      contentItemCountsBySubject,
      contentItemCountsByType,
      publishedVersions,
      recentAuditLogs,
      recentContentVersions,
    ] = await Promise.all([
      this.prismaService.adminUser.count(),
      this.prismaService.textbookEdition.count(),
      this.prismaService.textbookVolume.count(),
      this.prismaService.textbookNode.count(),
      this.prismaService.knowledgePoint.count(),
      this.prismaService.knowledgePoint.count({
        where: {
          isEnabled: true,
        },
      }),
      this.prismaService.contentItem.count(),
      this.prismaService.contentItemVersion.count({
        where: {
          reviewStatus: ReviewStatus.PUBLISHED,
        },
      }),
      this.prismaService.contentItemVersion.groupBy({
        by: ['reviewStatus'],
        _count: {
          reviewStatus: true,
        },
      }),
      this.prismaService.contentItemVersion.count({
        where: {
          createdAt: {
            gte: last7DaysStart,
            lte: now,
          },
        },
      }),
      this.prismaService.contentItemVersion.count({
        where: {
          createdAt: {
            gte: previous7DaysStart,
            lt: last7DaysStart,
          },
        },
      }),
      this.prismaService.contentItemVersion.count({
        where: {
          publishedAt: {
            gte: last7DaysStart,
            lte: now,
          },
        },
      }),
      this.prismaService.contentItemVersion.count({
        where: {
          publishedAt: {
            gte: previous7DaysStart,
            lt: last7DaysStart,
          },
        },
      }),
      this.prismaService.subject.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prismaService.contentItem.groupBy({
        by: ['subjectId'],
        _count: {
          subjectId: true,
        },
      }),
      this.prismaService.contentItem.groupBy({
        by: ['itemType'],
        _count: {
          itemType: true,
        },
      }),
      this.prismaService.contentItemVersion.findMany({
        where: {
          reviewStatus: ReviewStatus.PUBLISHED,
        },
        select: {
          contentItem: {
            select: {
              subjectId: true,
            },
          },
        },
      }),
      this.prismaService.adminAuditLog.findMany({
        include: {
          adminUser: true,
        },
        orderBy: [{ createdAt: 'desc' }],
        take: 5,
      }),
      this.prismaService.contentItemVersion.findMany({
        include: {
          contentItem: {
            include: {
              subject: true,
            },
          },
        },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        take: 5,
      }),
    ]);

    for (const item of contentVersionCounts) {
      reviewStatusCounts[item.reviewStatus] = item._count.reviewStatus;
    }

    const contentItemCountBySubjectId = new Map(
      contentItemCountsBySubject.map((item) => [item.subjectId, item._count.subjectId]),
    );
    const publishedVersionCountBySubjectId = new Map<string, number>();
    for (const version of publishedVersions) {
      publishedVersionCountBySubjectId.set(
        version.contentItem.subjectId,
        (publishedVersionCountBySubjectId.get(version.contentItem.subjectId) ?? 0) + 1,
      );
    }

    return {
      metrics: {
        adminUserCount,
        textbookEditionCount,
        textbookVolumeCount,
        textbookNodeCount,
        knowledgePointCount,
        enabledKnowledgePointCount,
        contentItemCount,
        publishedContentVersionCount,
        reviewStatusCounts,
      },
      versionTrendSummary: {
        last7Days: {
          totalChanges: last7DaysTotalChanges,
          publishes: last7DaysPublishes,
        },
        previous7Days: {
          totalChanges: previous7DaysTotalChanges,
          publishes: previous7DaysPublishes,
        },
        delta: {
          totalChanges: last7DaysTotalChanges - previous7DaysTotalChanges,
          publishes: last7DaysPublishes - previous7DaysPublishes,
        },
      },
      assetSummary: {
        bySubject: subjects.map((subject) => ({
          subjectCode: subject.code,
          subjectName: subject.name,
          contentItemCount: contentItemCountBySubjectId.get(subject.id) ?? 0,
          publishedVersionCount: publishedVersionCountBySubjectId.get(subject.id) ?? 0,
        })),
        byItemType: contentItemCountsByType
          .map((item) => ({
            itemType: item.itemType,
            contentItemCount: item._count.itemType,
          }))
          .sort((left, right) => right.contentItemCount - left.contentItemCount),
      },
      platformConfigSummary: {
        learningDefaults: DEFAULT_CHILD_LEARNING_SETTINGS_SUMMARY,
        verificationCode: {
          expiresInSec: VERIFICATION_CODE_EXPIRES_IN_SEC,
        },
        accessToken: {
          expiresIn: ACCESS_TOKEN_EXPIRES_IN,
        },
      },
      recentAuditLogs: recentAuditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        targetType: log.targetType,
        summary: log.summary,
        adminDisplayName: log.adminUser.displayName,
        createdAt: log.createdAt.toISOString(),
      })),
      recentContentVersions: recentContentVersions.map((version) => ({
        id: version.id,
        contentItemId: version.contentItemId,
        contentItemTitle: version.contentItem.title,
        subjectCode: version.contentItem.subject.code,
        version: version.version,
        reviewStatus: version.reviewStatus,
        title: version.title,
        changeSummary: version.changeSummary,
        publishedAt: version.publishedAt?.toISOString() ?? null,
        updatedAt: version.updatedAt.toISOString(),
      })),
    };
  }
}
