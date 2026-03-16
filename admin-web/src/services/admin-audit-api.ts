import { http } from './http';

export type AdminAuditLogRecord = {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  summary: string;
  payload: Record<string, unknown> | null;
  adminUserId: string;
  adminUsername: string;
  adminDisplayName: string;
  createdAt: string;
};

export const adminAuditApi = {
  async listLogs(params: {
    action?: string;
    targetType?: string;
    limit?: number;
  }): Promise<AdminAuditLogRecord[]> {
    const { data } = await http.get<AdminAuditLogRecord[]>('/admin-audit/logs', {
      params,
    });
    return data;
  },
};
