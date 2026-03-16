import { http } from './http';

export type AdminContentItemRecord = {
  id: string;
  subjectCode: string;
  itemType: string;
  canonicalKey: string | null;
  title: string;
  summary: string | null;
  difficultyLevel: number;
  k12Stage: string | null;
  isReusable: boolean;
  currentVersion: number;
  currentVersionId: string | null;
  currentReviewStatus: string | null;
  versionCount: number;
  updatedAt: string;
};

export type AdminContentItemVersionRecord = {
  id: string;
  version: number;
  reviewStatus: string;
  title: string;
  changeSummary: string | null;
  publishedAt: string | null;
  updatedAt: string;
};

export const adminContentApi = {
  async listContentItems(params: {
    subjectCode?: string;
    itemType?: string;
    reviewStatus?: string;
    limit?: number;
  }) {
    const { data } = await http.get<AdminContentItemRecord[]>('/admin-content/content-items', {
      params,
    });
    return data;
  },
  async listContentItemVersions(contentItemId: string) {
    const { data } = await http.get<AdminContentItemVersionRecord[]>(
      `/admin-content/content-items/${contentItemId}/versions`,
    );
    return data;
  },
};
