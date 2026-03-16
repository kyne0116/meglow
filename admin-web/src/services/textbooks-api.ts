import { http } from './http';

export type SubjectRecord = {
  id: string;
  code: 'ENGLISH' | 'CHINESE' | 'MATH';
  name: string;
  description: string | null;
  isEnabled: boolean;
  sortOrder: number;
};

export type TextbookEditionRecord = {
  id: string;
  subjectId: string;
  subjectCode: 'ENGLISH' | 'CHINESE' | 'MATH';
  publisherId: string;
  publisherName: string;
  code: string;
  displayName: string;
  regionScope: string | null;
  isEnabled: boolean;
};

export type TextbookVolumeRecord = {
  id: string;
  editionId: string;
  grade: number;
  semester: string;
  volumeLabel: string;
  k12Stage: string;
  version: number;
  reviewStatus: string;
  publishedAt: string | null;
};

export type TextbookTreeNodeRecord = {
  id: string;
  parentId: string | null;
  nodeType: string;
  nodeCode: string | null;
  title: string;
  depth: number;
  sortOrder: number;
  isLeaf: boolean;
  metadata?: Record<string, unknown> | null;
  children: TextbookTreeNodeRecord[];
};

export type NodeContentItemRecord = {
  id: string;
  itemType: string;
  title: string;
  difficultyLevel: number;
  k12Stage: string | null;
  isPrimary: boolean;
  contentVersionId: string | null;
  version: number | null;
  reviewStatus: string | null;
};

export type TextbookNodeDetailRecord = {
  id: string;
  volumeId: string;
  parentId: string | null;
  nodeType: string;
  nodeCode: string | null;
  title: string;
  description: string | null;
  depth: number;
  sortOrder: number;
  isLeaf: boolean;
  metadata?: Record<string, unknown> | null;
};

export type KnowledgePointRecord = {
  id: string;
  subjectCode: 'ENGLISH' | 'CHINESE' | 'MATH';
  code: string;
  name: string;
  description: string | null;
  difficultyLevel: number;
  k12Stage: string | null;
  isEnabled: boolean;
  tags: Record<string, unknown> | null;
};

export const textbooksApi = {
  async listSubjects(): Promise<SubjectRecord[]> {
    const { data } = await http.get<SubjectRecord[]>('/subjects', {
      params: {
        enabled: true,
      },
    });
    return data;
  },
  async listEditions(subjectCode: string): Promise<TextbookEditionRecord[]> {
    const { data } = await http.get<TextbookEditionRecord[]>('/textbooks/editions', {
      params: {
        subjectCode,
        enabled: true,
      },
    });
    return data;
  },
  async listVolumes(editionId: string): Promise<TextbookVolumeRecord[]> {
    const { data } = await http.get<TextbookVolumeRecord[]>(`/textbooks/editions/${editionId}/volumes`, {
      params: {
        publishedOnly: false,
      },
    });
    return data;
  },
  async getVolumeTree(volumeId: string): Promise<{ volume: { id: string; volumeLabel: string }; nodes: TextbookTreeNodeRecord[] }> {
    const { data } = await http.get(`/textbooks/volumes/${volumeId}/tree`);
    return data;
  },
  async getNode(nodeId: string): Promise<TextbookNodeDetailRecord> {
    const { data } = await http.get<TextbookNodeDetailRecord>(`/textbooks/nodes/${nodeId}`);
    return data;
  },
  async listNodeContentItems(nodeId: string): Promise<NodeContentItemRecord[]> {
    const { data } = await http.get<NodeContentItemRecord[]>(`/textbooks/nodes/${nodeId}/content-items`, {
      params: {
        includeDraft: true,
      },
    });
    return data;
  },
  async listNodeKnowledgePoints(nodeId: string): Promise<KnowledgePointRecord[]> {
    const { data } = await http.get<KnowledgePointRecord[]>(`/textbooks/nodes/${nodeId}/knowledge-points`);
    return data;
  },
  async listKnowledgePoints(params: {
    subjectCode?: string;
    k12Stage?: string;
    keyword?: string;
    enabled?: boolean;
  }): Promise<KnowledgePointRecord[]> {
    const { data } = await http.get<KnowledgePointRecord[]>('/textbooks/knowledge-points', {
      params,
    });
    return data;
  },
};
