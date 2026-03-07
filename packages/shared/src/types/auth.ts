export interface LoginRequest {
  phone: string;
  verificationCode: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: string;
  parentId: string;
  familyId: string;
}
