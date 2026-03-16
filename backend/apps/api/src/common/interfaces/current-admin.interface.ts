import { AdminRole } from '@prisma/client';

export interface CurrentAdmin {
  adminUserId: string;
  username: string;
  role: AdminRole;
}
