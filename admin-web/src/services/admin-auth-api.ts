import { http, setBearerToken } from './http';

type LoginPayload = {
  username: string;
  password: string;
};

type LoginResponse = {
  accessToken: string;
  expiresIn: string;
  adminUserId: string;
  username: string;
  displayName: string;
  role: string;
};

type AdminProfile = {
  adminUserId: string;
  username: string;
  displayName: string;
  role: string;
};

export const adminAuthApi = {
  setAccessToken(token: string) {
    setBearerToken(token);
  },
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await http.post<LoginResponse>('/admin-auth/login', payload);
    return data;
  },
  async getMe(): Promise<AdminProfile> {
    const { data } = await http.get<AdminProfile>('/admin-auth/me');
    return data;
  },
};
