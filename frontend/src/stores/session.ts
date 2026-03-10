import { defineStore } from "pinia";

const SESSION_STORAGE_KEY = "meglow_session";

interface SessionState {
  accessToken: string;
  parentId: string;
  familyId: string;
}

export const useSessionStore = defineStore("session", {
  state: (): SessionState => ({
    accessToken: "",
    parentId: "",
    familyId: ""
  }),
  actions: {
    setSession(payload: SessionState): void {
      this.accessToken = payload.accessToken;
      this.parentId = payload.parentId;
      this.familyId = payload.familyId;
      uni.setStorageSync(SESSION_STORAGE_KEY, payload);
    },
    loadFromStorage(): void {
      const cached = uni.getStorageSync(SESSION_STORAGE_KEY) as SessionState | null | undefined;
      if (!cached || !cached.accessToken) {
        return;
      }
      this.accessToken = cached.accessToken;
      this.parentId = cached.parentId;
      this.familyId = cached.familyId;
    },
    clearSession(): void {
      this.accessToken = "";
      this.parentId = "";
      this.familyId = "";
      uni.removeStorageSync(SESSION_STORAGE_KEY);
    }
  }
});
