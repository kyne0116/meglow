export interface AuthSession {
  token: string;
  parentId: string;
  familyId: string;
  phone: string;
  role: 'OWNER' | 'MEMBER';
}
