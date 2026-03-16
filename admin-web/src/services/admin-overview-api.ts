import { http } from './http';

export type AdminOverviewResponse = {
  metrics: {
    adminUserCount: number;
    textbookEditionCount: number;
    textbookVolumeCount: number;
    textbookNodeCount: number;
    knowledgePointCount: number;
    enabledKnowledgePointCount: number;
    contentItemCount: number;
    publishedContentVersionCount: number;
    reviewStatusCounts: {
      DRAFT: number;
      REVIEWING: number;
      APPROVED: number;
      REJECTED: number;
      PUBLISHED: number;
      OFFLINE: number;
    };
  };
  versionTrendSummary: {
    last7Days: {
      totalChanges: number;
      publishes: number;
    };
    previous7Days: {
      totalChanges: number;
      publishes: number;
    };
    delta: {
      totalChanges: number;
      publishes: number;
    };
  };
  assetSummary: {
    bySubject: Array<{
      subjectCode: string;
      subjectName: string;
      contentItemCount: number;
      publishedVersionCount: number;
    }>;
    byItemType: Array<{
      itemType: string;
      contentItemCount: number;
    }>;
  };
  platformConfigSummary: {
    learningDefaults: {
      autoApprove: boolean;
      dailyDurationMin: number;
      wordsPerSession: number;
    };
    verificationCode: {
      expiresInSec: number;
    };
    accessToken: {
      expiresIn: string;
    };
  };
  recentAuditLogs: Array<{
    id: string;
    action: string;
    targetType: string;
    summary: string;
    adminDisplayName: string;
    createdAt: string;
  }>;
  recentContentVersions: Array<{
    id: string;
    contentItemId: string;
    contentItemTitle: string;
    subjectCode: string;
    version: number;
    reviewStatus: string;
    title: string;
    changeSummary: string | null;
    publishedAt: string | null;
    updatedAt: string;
  }>;
};

export const adminOverviewApi = {
  async getOverview(): Promise<AdminOverviewResponse> {
    const { data } = await http.get<AdminOverviewResponse>('/admin-overview');
    return data;
  },
};
