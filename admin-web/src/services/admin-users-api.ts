import { http } from './http';

export type AdminUserRecord = {
  id: string;
  username: string;
  displayName: string;
  role: string;
  isEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export const adminUsersApi = {
  async listAdminUsers(params: {
    role?: string;
    enabled?: boolean;
    limit?: number;
  }): Promise<AdminUserRecord[]> {
    const { data } = await http.get<AdminUserRecord[]>('/admin-users', {
      params,
    });
    return data;
  },
  async createAdminUser(payload: {
    username: string;
    displayName: string;
    password: string;
    role: string;
  }): Promise<AdminUserRecord> {
    const { data } = await http.post<AdminUserRecord>('/admin-users', payload);
    return data;
  },
  async updateAdminUser(
    adminUserId: string,
    payload: {
      displayName?: string;
      role?: string;
      isEnabled?: boolean;
      password?: string;
    },
  ): Promise<AdminUserRecord> {
    const { data } = await http.patch<AdminUserRecord>(`/admin-users/${adminUserId}`, payload);
    return data;
  },
};
