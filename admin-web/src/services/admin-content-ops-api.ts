import { http } from './http';

export type CreateAdminContentItemPayload = {
  subjectCode: string;
  itemType: string;
  canonicalKey?: string;
  title: string;
  summary?: string;
  difficultyLevel?: number;
  k12Stage?: string;
  isReusable?: boolean;
};

export type CreateAdminContentItemVersionPayload = {
  title: string;
  payload: Record<string, unknown>;
  changeSummary?: string;
};

export type CreateTextbookEditionPayload = {
  subjectCode: string;
  publisherCode: string;
  code: string;
  displayName: string;
  curriculumYear?: number;
  regionScope?: string;
  isEnabled?: boolean;
};

export type CreateTextbookVolumePayload = {
  grade: number;
  semester: string;
  volumeLabel: string;
  k12Stage: string;
  sortOrder?: number;
  version?: number;
};

export type CreateTextbookNodePayload = {
  parentId?: string;
  nodeType: string;
  nodeCode?: string;
  title: string;
  description?: string;
  sortOrder?: number;
  isLeaf?: boolean;
  metadata?: Record<string, unknown>;
};

export type UpdateTextbookNodePayload = {
  parentId?: string | null;
  nodeType?: string;
  nodeCode?: string;
  title?: string;
  description?: string;
  sortOrder?: number;
  isLeaf?: boolean;
  metadata?: Record<string, unknown>;
};

export const adminContentOpsApi = {
  async createContentItem(payload: CreateAdminContentItemPayload) {
    const { data } = await http.post('/admin-content-ops/content-items', payload);
    return data as { id: string; title: string; itemType: string };
  },
  async createContentItemVersion(contentItemId: string, payload: CreateAdminContentItemVersionPayload) {
    const { data } = await http.post(`/admin-content-ops/content-items/${contentItemId}/versions`, payload);
    return data as { id: string; contentItemId: string; version: number; reviewStatus: string };
  },
  async publishContentItemVersion(contentItemId: string, versionId: string) {
    const { data } = await http.post(`/admin-content-ops/content-items/${contentItemId}/publish`, {
      versionId,
    });
    return data as { contentItemId: string; versionId: string; reviewStatus: string };
  },
  async createTextbookEdition(payload: CreateTextbookEditionPayload) {
    const { data } = await http.post('/admin-content-ops/textbooks/editions', payload);
    return data as { id: string; code: string; displayName: string };
  },
  async createTextbookVolume(editionId: string, payload: CreateTextbookVolumePayload) {
    const { data } = await http.post(`/admin-content-ops/textbooks/editions/${editionId}/volumes`, payload);
    return data as { id: string; editionId: string; grade: number; semester: string; volumeLabel: string };
  },
  async createTextbookNode(volumeId: string, payload: CreateTextbookNodePayload) {
    const { data } = await http.post(`/admin-content-ops/textbooks/volumes/${volumeId}/nodes`, payload);
    return data as { id: string; volumeId: string; parentId: string | null; title: string; depth: number };
  },
  async updateTextbookNode(nodeId: string, payload: UpdateTextbookNodePayload) {
    const { data } = await http.patch(`/admin-content-ops/textbooks/nodes/${nodeId}`, payload);
    return data as {
      id: string;
      volumeId: string;
      parentId: string | null;
      title: string;
      nodeType: string;
      nodeCode: string | null;
      description: string | null;
      sortOrder: number;
      isLeaf: boolean;
      depth: number;
    };
  },
  async deleteTextbookNode(nodeId: string) {
    const { data } = await http.delete(`/admin-content-ops/textbooks/nodes/${nodeId}`);
    return data as { nodeId: string; deleted: boolean };
  },
  async createKnowledgePoint(payload: {
    subjectCode: string;
    code: string;
    name: string;
    description?: string;
    difficultyLevel?: number;
    k12Stage?: string;
    tags?: Record<string, unknown>;
  }) {
    const { data } = await http.post('/admin-content-ops/knowledge-points', payload);
    return data as { id: string; code: string; name: string };
  },
  async updateKnowledgePoint(knowledgePointId: string, payload: {
    code?: string;
    name?: string;
    description?: string;
    difficultyLevel?: number;
    k12Stage?: string;
    tags?: Record<string, unknown>;
    isEnabled?: boolean;
  }) {
    const { data } = await http.patch(`/admin-content-ops/knowledge-points/${knowledgePointId}`, payload);
    return data as {
      id: string;
      code: string;
      name: string;
      difficultyLevel: number;
      k12Stage: string | null;
      isEnabled: boolean;
    };
  },
  async attachContentItemToNode(nodeId: string, payload: {
    contentItemId: string;
    contentVersionId?: string;
    isPrimary?: boolean;
    sortOrder?: number;
    metadata?: Record<string, unknown>;
  }) {
    const { data } = await http.post(`/admin-content-ops/textbooks/nodes/${nodeId}/content-items`, payload);
    return data as { id: string; textbookNodeId: string; contentItemId: string };
  },
  async detachContentItemFromNode(nodeId: string, contentItemId: string) {
    const { data } = await http.delete(
      `/admin-content-ops/textbooks/nodes/${nodeId}/content-items/${contentItemId}`,
    );
    return data as { textbookNodeId: string; contentItemId: string; deleted: boolean };
  },
  async attachKnowledgePointToNode(nodeId: string, payload: {
    knowledgePointId: string;
    relationType?: string;
    sortOrder?: number;
  }) {
    const { data } = await http.post(`/admin-content-ops/textbooks/nodes/${nodeId}/knowledge-points`, payload);
    return data as { id: string; textbookNodeId: string; knowledgePointId: string };
  },
  async detachKnowledgePointFromNode(nodeId: string, knowledgePointId: string) {
    const { data } = await http.delete(
      `/admin-content-ops/textbooks/nodes/${nodeId}/knowledge-points/${knowledgePointId}`,
    );
    return data as { textbookNodeId: string; knowledgePointId: string; deleted: boolean };
  },
};
