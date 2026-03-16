import { Injectable, NotFoundException } from '@nestjs/common';
import { SubjectCode } from '@prisma/client';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { SUBJECT_SEEDS } from './subject-seeds';

export interface SubjectRecord {
  id: string;
  code: 'ENGLISH' | 'CHINESE' | 'MATH';
  name: string;
  description: string | null;
  isEnabled: boolean;
  sortOrder: number;
}

@Injectable()
export class SubjectsService {
  constructor(private readonly prismaService: PrismaService) {}

  async listSubjects(enabled?: boolean): Promise<SubjectRecord[]> {
    await this.ensureSeedSubjects();
    const subjects = await this.prismaService.subject.findMany({
      where: enabled === undefined ? undefined : { isEnabled: enabled },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return subjects.map((subject) => ({
      id: subject.id,
      code: subject.code,
      name: subject.name,
      description: subject.description,
      isEnabled: subject.isEnabled,
      sortOrder: subject.sortOrder,
    }));
  }

  async getSubjectByCode(code: SubjectCode) {
    await this.ensureSeedSubjects();
    const subject = await this.prismaService.subject.findUnique({
      where: {
        code,
      },
    });

    if (!subject) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'subject not found',
        details: {},
      });
    }

    return subject;
  }

  private async ensureSeedSubjects(): Promise<void> {
    const existingSubjects = await this.prismaService.subject.findMany({
      select: {
        code: true,
      },
    });
    const existingCodes = new Set(existingSubjects.map((subject) => subject.code));
    const missingSubjects = SUBJECT_SEEDS.filter(
      (subject) => !existingCodes.has(subject.code),
    );
    if (missingSubjects.length === 0) {
      return;
    }

    await this.prismaService.subject.createMany({
      data: missingSubjects,
    });
  }
}
