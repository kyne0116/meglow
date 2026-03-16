import { defineStore } from 'pinia';
import { adminAuthApi } from '../services/admin-auth-api';

const STORAGE_KEY = 'meglow_admin_access_token';

type AdminProfile = {
  adminUserId: string;
  username: string;
  displayName: string;
  role: string;
};

export const useAdminSessionStore = defineStore('admin-session', {
  state: () => ({
    initialized: false,
    accessToken: '' as string,
    profile: null as AdminProfile | null,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.accessToken && state.profile),
  },
  actions: {
    async bootstrap() {
      if (this.initialized) {
        return;
      }

      const token = window.localStorage.getItem(STORAGE_KEY) ?? '';
      if (!token) {
        this.initialized = true;
        return;
      }

      this.accessToken = token;
      adminAuthApi.setAccessToken(token);

      try {
        this.profile = await adminAuthApi.getMe();
      } catch {
        this.clearSession();
      } finally {
        this.initialized = true;
      }
    },
    async login(username: string, password: string) {
      const result = await adminAuthApi.login({ username, password });
      this.accessToken = result.accessToken;
      this.profile = {
        adminUserId: result.adminUserId,
        username: result.username,
        displayName: result.displayName,
        role: result.role,
      };
      window.localStorage.setItem(STORAGE_KEY, result.accessToken);
      adminAuthApi.setAccessToken(result.accessToken);
      this.initialized = true;
    },
    logout() {
      this.clearSession();
    },
    clearSession() {
      this.accessToken = '';
      this.profile = null;
      this.initialized = true;
      adminAuthApi.setAccessToken('');
      window.localStorage.removeItem(STORAGE_KEY);
    },
  },
});
