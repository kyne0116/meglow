import { Injectable, NotFoundException } from '@nestjs/common';
import { BindingStatus, K12Stage, Prisma, SemesterType, SubjectCode } from '@prisma/client';
import { CurrentParent } from '../common/interfaces/current-parent.interface';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { SubjectsService } from '../subjects/subjects.service';
import { CreateChildSubjectBindingDto } from './dto/create-child-subject-binding.dto';
import { UpdateChildSubjectBindingDto } from './dto/update-child-subject-binding.dto';
import { UpdateChildSubjectProgressDto } from './dto/update-child-subject-progress.dto';

export interface ChildSubjectBindingRecord {
  id: string;
  childId: string;
  subjectId: string;
  subjectCode: SubjectCode;
  subjectName: string;
  editionId: string;
  editionDisplayName: string;
  volumeId: string;
  volumeLabel: string;
  grade: number;
  semester: SemesterType;
  k12Stage: K12Stage;
  currentNodeId: string | null;
  currentNodeTitle: string | null;
  status: BindingStatus;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface ChildSubjectProgressRecord {
  bindingId: string;
  currentNodeId: string | null;
  currentNodeTitle: string | null;
  lastCompletedNodeId: string | null;
  lastCompletedNodeTitle: string | null;
  completedNodeCount: number;
  lastStudiedAt: string | null;
}

@Injectable()
export class ChildSubjectBindingsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly subjectsService: SubjectsService,
  ) {}

  async getBindings(familyId: string, childId: string): Promise<ChildSubjectBindingRecord[]> {
    await this.ensureChildBelongsToFamily(familyId, childId);
    const bindings = await this.prismaService.childSubjectBinding.findMany({
      where: {
        childId,
        status: BindingStatus.ACTIVE,
      },
      include: {
        subject: true,
        edition: true,
        volume: true,
        currentNode: true,
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return bindings.map((binding) => this.toBindingRecord(binding));
  }

  async createBinding(
    currentParent: CurrentParent,
    childId: string,
    payload: CreateChildSubjectBindingDto,
  ): Promise<ChildSubjectBindingRecord> {
    await this.ensureChildBelongsToFamily(currentParent.familyId, childId);
    const subject = await this.subjectsService.getSubjectByCode(payload.subjectCode);
    const edition = await this.prismaService.textbookEdition.findUnique({
      where: { id: payload.editionId },
    });
    if (!edition || edition.subjectId !== subject.id) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'textbook edition not found',
        details: {},
      });
    }

    const volume = await this.prismaService.textbookVolume.findUnique({
      where: { id: payload.volumeId },
    });
    if (!volume || volume.editionId !== edition.id) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'textbook volume not found',
        details: {},
      });
    }

    if (volume.grade !== payload.grade || volume.semester !== payload.semester) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'textbook volume does not match grade or semester',
        details: {},
      });
    }

    await this.assertNodeBelongsToVolume(payload.currentNodeId, volume.id);
    const now = new Date();
    const bindingId = await this.prismaService.$transaction(async (prisma) => {
      await prisma.childSubjectBinding.updateMany({
        where: {
          childId,
          subjectId: subject.id,
          status: BindingStatus.ACTIVE,
        },
        data: {
          status: BindingStatus.ARCHIVED,
          effectiveTo: now,
        },
      });

      const createdBinding = await prisma.childSubjectBinding.create({
        data: {
          childId,
          subjectId: subject.id,
          editionId: edition.id,
          volumeId: volume.id,
          currentNodeId: payload.currentNodeId ?? null,
          grade: payload.grade,
          semester: payload.semester,
          k12Stage: volume.k12Stage,
          status: BindingStatus.ACTIVE,
          effectiveFrom: now,
          metadataJson: payload.metadata
            ? (payload.metadata as Prisma.InputJsonValue)
            : undefined,
        },
      });

      await prisma.childSubjectProgress.create({
        data: {
          childSubjectBindingId: createdBinding.id,
          currentNodeId: payload.currentNodeId ?? null,
        },
      });

      return createdBinding.id;
    });

    return this.getBindingRecord(currentParent.familyId, childId, bindingId);
  }

  async updateBinding(
    familyId: string,
    childId: string,
    bindingId: string,
    payload: UpdateChildSubjectBindingDto,
  ): Promise<ChildSubjectBindingRecord> {
    const binding = await this.getBindingEntity(familyId, childId, bindingId);
    await this.assertNodeBelongsToVolume(payload.currentNodeId, binding.volumeId);

    await this.prismaService.$transaction(async (prisma) => {
      await prisma.childSubjectBinding.update({
        where: { id: binding.id },
        data: {
          currentNodeId: payload.currentNodeId ?? binding.currentNodeId,
          metadataJson:
            payload.metadata !== undefined
              ? (payload.metadata as Prisma.InputJsonValue)
              : binding.metadataJson,
        },
      });

      if (payload.currentNodeId !== undefined) {
        await prisma.childSubjectProgress.upsert({
          where: {
            childSubjectBindingId: binding.id,
          },
          update: {
            currentNodeId: payload.currentNodeId,
          },
          create: {
            childSubjectBindingId: binding.id,
            currentNodeId: payload.currentNodeId,
          },
        });
      }
    });

    return this.getBindingRecord(familyId, childId, bindingId);
  }

  async archiveBinding(
    familyId: string,
    childId: string,
    bindingId: string,
  ): Promise<{ bindingId: string; status: BindingStatus }> {
    await this.getBindingEntity(familyId, childId, bindingId);
    await this.prismaService.childSubjectBinding.update({
      where: { id: bindingId },
      data: {
        status: BindingStatus.ARCHIVED,
        effectiveTo: new Date(),
      },
    });

    return {
      bindingId,
      status: BindingStatus.ARCHIVED,
    };
  }

  async getProgress(
    familyId: string,
    childId: string,
    bindingId: string,
  ): Promise<ChildSubjectProgressRecord> {
    await this.getBindingEntity(familyId, childId, bindingId);
    const progress = await this.prismaService.childSubjectProgress.upsert({
      where: {
        childSubjectBindingId: bindingId,
      },
      update: {},
      create: {
        childSubjectBindingId: bindingId,
      },
      include: {
        currentNode: true,
        lastCompletedNode: true,
      },
    });

    return this.toProgressRecord(progress);
  }

  async updateProgress(
    familyId: string,
    childId: string,
    bindingId: string,
    payload: UpdateChildSubjectProgressDto,
  ): Promise<ChildSubjectProgressRecord> {
    const binding = await this.getBindingEntity(familyId, childId, bindingId);
    await this.assertNodeBelongsToVolume(payload.currentNodeId, binding.volumeId);
    await this.assertNodeBelongsToVolume(payload.lastCompletedNodeId, binding.volumeId);

    const progress = await this.prismaService.$transaction(async (prisma) => {
      const updatedProgress = await prisma.childSubjectProgress.upsert({
        where: {
          childSubjectBindingId: bindingId,
        },
        update: {
          ...(payload.currentNodeId !== undefined ? { currentNodeId: payload.currentNodeId } : {}),
          ...(payload.lastCompletedNodeId !== undefined
            ? { lastCompletedNodeId: payload.lastCompletedNodeId }
            : {}),
          ...(payload.completedNodeCount !== undefined
            ? { completedNodeCount: payload.completedNodeCount }
            : {}),
          lastStudiedAt: new Date(),
        },
        create: {
          childSubjectBindingId: bindingId,
          currentNodeId: payload.currentNodeId ?? null,
          lastCompletedNodeId: payload.lastCompletedNodeId ?? null,
          completedNodeCount: payload.completedNodeCount ?? 0,
          lastStudiedAt: new Date(),
        },
      });

      if (payload.currentNodeId !== undefined) {
        await prisma.childSubjectBinding.update({
          where: { id: bindingId },
          data: {
            currentNodeId: payload.currentNodeId,
          },
        });
      }

      return prisma.childSubjectProgress.findUniqueOrThrow({
        where: { id: updatedProgress.id },
        include: {
          currentNode: true,
          lastCompletedNode: true,
        },
      });
    });

    return this.toProgressRecord(progress);
  }

  private async getBindingEntity(familyId: string, childId: string, bindingId: string) {
    const binding = await this.prismaService.childSubjectBinding.findFirst({
      where: {
        id: bindingId,
        childId,
        child: {
          familyId,
        },
      },
    });

    if (!binding) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'child subject binding not found',
        details: {},
      });
    }

    return binding;
  }

  private async getBindingRecord(
    familyId: string,
    childId: string,
    bindingId: string,
  ): Promise<ChildSubjectBindingRecord> {
    const binding = await this.prismaService.childSubjectBinding.findFirst({
      where: {
        id: bindingId,
        childId,
        child: {
          familyId,
        },
      },
      include: {
        subject: true,
        edition: true,
        volume: true,
        currentNode: true,
      },
    });

    if (!binding) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'child subject binding not found',
        details: {},
      });
    }

    return this.toBindingRecord(binding);
  }

  private async ensureChildBelongsToFamily(familyId: string, childId: string): Promise<void> {
    const child = await this.prismaService.child.findFirst({
      where: {
        id: childId,
        familyId,
      },
      select: {
        id: true,
      },
    });

    if (!child) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'child not found',
        details: {},
      });
    }
  }

  private async assertNodeBelongsToVolume(nodeId: string | undefined, volumeId: string): Promise<void> {
    if (!nodeId) {
      return;
    }

    const node = await this.prismaService.textbookNode.findFirst({
      where: {
        id: nodeId,
        volumeId,
      },
      select: {
        id: true,
      },
    });

    if (!node) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'textbook node not found',
        details: {},
      });
    }
  }

  private toBindingRecord(binding: {
    id: string;
    childId: string;
    subjectId: string;
    grade: number;
    semester: SemesterType;
    k12Stage: K12Stage;
    status: BindingStatus;
    effectiveFrom: Date;
    effectiveTo: Date | null;
    subject: { code: SubjectCode; name: string };
    edition: { id: string; displayName: string };
    volume: { id: string; volumeLabel: string };
    currentNode: { id: string; title: string } | null;
  }): ChildSubjectBindingRecord {
    return {
      id: binding.id,
      childId: binding.childId,
      subjectId: binding.subjectId,
      subjectCode: binding.subject.code,
      subjectName: binding.subject.name,
      editionId: binding.edition.id,
      editionDisplayName: binding.edition.displayName,
      volumeId: binding.volume.id,
      volumeLabel: binding.volume.volumeLabel,
      grade: binding.grade,
      semester: binding.semester,
      k12Stage: binding.k12Stage,
      currentNodeId: binding.currentNode?.id ?? null,
      currentNodeTitle: binding.currentNode?.title ?? null,
      status: binding.status,
      effectiveFrom: binding.effectiveFrom.toISOString(),
      effectiveTo: binding.effectiveTo?.toISOString() ?? null,
    };
  }

  private toProgressRecord(progress: {
    childSubjectBindingId: string;
    currentNodeId: string | null;
    lastCompletedNodeId: string | null;
    completedNodeCount: number;
    lastStudiedAt: Date | null;
    currentNode: { title: string } | null;
    lastCompletedNode: { title: string } | null;
  }): ChildSubjectProgressRecord {
    return {
      bindingId: progress.childSubjectBindingId,
      currentNodeId: progress.currentNodeId,
      currentNodeTitle: progress.currentNode?.title ?? null,
      lastCompletedNodeId: progress.lastCompletedNodeId,
      lastCompletedNodeTitle: progress.lastCompletedNode?.title ?? null,
      completedNodeCount: progress.completedNodeCount,
      lastStudiedAt: progress.lastStudiedAt?.toISOString() ?? null,
    };
  }
}
