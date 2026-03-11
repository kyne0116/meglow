import { Request } from 'express';
import { CurrentParent } from './current-parent.interface';

export type AuthenticatedRequest = Request & {
  currentParent?: CurrentParent;
};
