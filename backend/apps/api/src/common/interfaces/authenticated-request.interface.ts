import { Request } from 'express';
import { CurrentAdmin } from './current-admin.interface';
import { CurrentParent } from './current-parent.interface';

export type AuthenticatedRequest = Request & {
  currentAdmin?: CurrentAdmin;
  currentParent?: CurrentParent;
};
