import { SubjectCode } from '@prisma/client';

export const SUBJECT_SEEDS: Array<{
  code: SubjectCode;
  name: string;
  description: string;
  sortOrder: number;
}> = [
  { code: SubjectCode.ENGLISH, name: '英语', description: '英语学科', sortOrder: 1 },
  { code: SubjectCode.CHINESE, name: '语文', description: '语文学科', sortOrder: 2 },
  { code: SubjectCode.MATH, name: '数学', description: '数学学科', sortOrder: 3 },
];
