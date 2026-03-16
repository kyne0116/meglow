import {
  ContentItemType,
  K12Stage,
  Prisma,
  PrismaClient,
  ReviewStatus,
  SemesterType,
  SubjectCode,
  TextbookNodeType,
} from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

type TextbookDataset = {
  publisher: {
    code: string;
    name: string;
    shortName?: string | null;
    region?: string | null;
  };
  edition: {
    subjectCode: SubjectCode;
    publisherCode: string;
    code: string;
    displayName: string;
    curriculumYear?: number | null;
    regionScope?: string | null;
  };
  volume: {
    editionCode: string;
    grade: number;
    semester: SemesterType;
    volumeLabel: string;
    k12Stage: K12Stage;
    sortOrder?: number;
    version?: number;
  };
  nodes: Array<{
    code: string;
    parentCode?: string | null;
    nodeType: TextbookNodeType;
    title: string;
    description?: string | null;
    sortOrder?: number;
    isLeaf?: boolean;
    metadata?: Record<string, unknown>;
  }>;
  contentItems: Array<{
    nodeCode: string;
    canonicalKey: string;
    itemType: ContentItemType;
    title: string;
    summary?: string | null;
    difficultyLevel?: number;
    k12Stage?: K12Stage | null;
    sortOrder?: number;
    isPrimary?: boolean;
    payload: Record<string, unknown>;
  }>;
};

const DATASET_PATHS = [
  path.join(
    __dirname,
    'seed-data',
    'textbooks',
    'english-rjb-grade7-second-term-2025.json',
  ),
];

export async function seedExternalTextbookDatasets(
  prisma: PrismaClient,
): Promise<void> {
  for (const datasetPath of DATASET_PATHS) {
    if (!fs.existsSync(datasetPath)) {
      continue;
    }

    const raw = fs.readFileSync(datasetPath, 'utf8');
    const dataset = JSON.parse(raw) as TextbookDataset;
    await importTextbookDataset(prisma, dataset);
  }
}

async function importTextbookDataset(
  prisma: PrismaClient,
  dataset: TextbookDataset,
): Promise<void> {
  const subject = await prisma.subject.findUniqueOrThrow({
    where: {
      code: dataset.edition.subjectCode,
    },
    select: {
      id: true,
    },
  });

  const publisher = await prisma.publisher.upsert({
    where: {
      code: dataset.publisher.code,
    },
    update: {
      name: dataset.publisher.name,
      shortName: dataset.publisher.shortName ?? null,
      region: dataset.publisher.region ?? null,
      isEnabled: true,
    },
    create: {
      code: dataset.publisher.code,
      name: dataset.publisher.name,
      shortName: dataset.publisher.shortName ?? null,
      region: dataset.publisher.region ?? null,
      isEnabled: true,
    },
  });

  const existingEdition = await prisma.textbookEdition.findFirst({
    where: {
      subjectId: subject.id,
      code: dataset.edition.code,
    },
    select: {
      id: true,
    },
  });

  const edition = existingEdition
    ? await prisma.textbookEdition.update({
        where: {
          id: existingEdition.id,
        },
        data: {
          publisherId: publisher.id,
          displayName: dataset.edition.displayName,
          curriculumYear: dataset.edition.curriculumYear ?? null,
          regionScope: dataset.edition.regionScope ?? null,
          isEnabled: true,
        },
      })
    : await prisma.textbookEdition.create({
        data: {
          subjectId: subject.id,
          publisherId: publisher.id,
          code: dataset.edition.code,
          displayName: dataset.edition.displayName,
          curriculumYear: dataset.edition.curriculumYear ?? null,
          regionScope: dataset.edition.regionScope ?? null,
          isEnabled: true,
        },
      });

  const volume = await prisma.textbookVolume.upsert({
    where: {
      editionId_grade_semester_version: {
        editionId: edition.id,
        grade: dataset.volume.grade,
        semester: dataset.volume.semester,
        version: dataset.volume.version ?? 1,
      },
    },
    update: {
      volumeLabel: dataset.volume.volumeLabel,
      k12Stage: dataset.volume.k12Stage,
      sortOrder: dataset.volume.sortOrder ?? 0,
      reviewStatus: ReviewStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    create: {
      editionId: edition.id,
      grade: dataset.volume.grade,
      semester: dataset.volume.semester,
      volumeLabel: dataset.volume.volumeLabel,
      k12Stage: dataset.volume.k12Stage,
      sortOrder: dataset.volume.sortOrder ?? 0,
      version: dataset.volume.version ?? 1,
      reviewStatus: ReviewStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  const nodeMap = new Map<string, { id: string; depth: number }>();
  for (const nodeSeed of dataset.nodes) {
    const parent = nodeSeed.parentCode ? nodeMap.get(nodeSeed.parentCode) : null;
    const depth = parent ? parent.depth + 1 : 1;
    const existingNode = await prisma.textbookNode.findFirst({
      where: {
        volumeId: volume.id,
        nodeCode: nodeSeed.code,
      },
      select: {
        id: true,
      },
    });

    const node = existingNode
      ? await prisma.textbookNode.update({
          where: {
            id: existingNode.id,
          },
          data: {
            parentId: parent?.id ?? null,
            nodeType: nodeSeed.nodeType,
            title: nodeSeed.title,
            description: nodeSeed.description ?? null,
            depth,
            sortOrder: nodeSeed.sortOrder ?? 0,
            isLeaf: nodeSeed.isLeaf ?? true,
            reviewStatus: ReviewStatus.PUBLISHED,
            metadataJson: toJson(nodeSeed.metadata),
          },
        })
      : await prisma.textbookNode.create({
          data: {
            volumeId: volume.id,
            parentId: parent?.id ?? null,
            nodeType: nodeSeed.nodeType,
            nodeCode: nodeSeed.code,
            title: nodeSeed.title,
            description: nodeSeed.description ?? null,
            depth,
            sortOrder: nodeSeed.sortOrder ?? 0,
            isLeaf: nodeSeed.isLeaf ?? true,
            reviewStatus: ReviewStatus.PUBLISHED,
            metadataJson: toJson(nodeSeed.metadata),
          },
        });

    nodeMap.set(nodeSeed.code, { id: node.id, depth });
  }

  for (const itemSeed of dataset.contentItems) {
    const node = nodeMap.get(itemSeed.nodeCode);
    if (!node) {
      throw new Error(`node not found for content item: ${itemSeed.nodeCode}`);
    }

    const existingContentItem = await prisma.contentItem.findFirst({
      where: {
        subjectId: subject.id,
        canonicalKey: itemSeed.canonicalKey,
      },
      select: {
        id: true,
      },
    });

    const contentItem = existingContentItem
      ? await prisma.contentItem.update({
          where: {
            id: existingContentItem.id,
          },
          data: {
            itemType: itemSeed.itemType,
            title: itemSeed.title,
            summary: itemSeed.summary ?? null,
            difficultyLevel: itemSeed.difficultyLevel ?? 1,
            k12Stage: itemSeed.k12Stage ?? null,
            isReusable: true,
          },
        })
      : await prisma.contentItem.create({
          data: {
            subjectId: subject.id,
            itemType: itemSeed.itemType,
            canonicalKey: itemSeed.canonicalKey,
            title: itemSeed.title,
            summary: itemSeed.summary ?? null,
            difficultyLevel: itemSeed.difficultyLevel ?? 1,
            k12Stage: itemSeed.k12Stage ?? null,
            isReusable: true,
          },
        });

    const version = await prisma.contentItemVersion.upsert({
      where: {
        contentItemId_version: {
          contentItemId: contentItem.id,
          version: 1,
        },
      },
      update: {
        reviewStatus: ReviewStatus.PUBLISHED,
        title: itemSeed.title,
        payloadJson: itemSeed.payload as Prisma.InputJsonValue,
        changeSummary: 'seed textbook dataset sync',
        publishedAt: new Date(),
      },
      create: {
        contentItemId: contentItem.id,
        version: 1,
        reviewStatus: ReviewStatus.PUBLISHED,
        title: itemSeed.title,
        payloadJson: itemSeed.payload as Prisma.InputJsonValue,
        changeSummary: 'seed textbook dataset sync',
        publishedAt: new Date(),
      },
    });

    await prisma.contentItem.update({
      where: {
        id: contentItem.id,
      },
      data: {
        currentVersion: version.version,
        currentVersionId: version.id,
      },
    });

    await prisma.textbookNodeContentItem.upsert({
      where: {
        textbookNodeId_contentItemId: {
          textbookNodeId: node.id,
          contentItemId: contentItem.id,
        },
      },
      update: {
        contentVersionId: version.id,
        isPrimary: itemSeed.isPrimary ?? true,
        sortOrder: itemSeed.sortOrder ?? 0,
      },
      create: {
        textbookNodeId: node.id,
        contentItemId: contentItem.id,
        contentVersionId: version.id,
        isPrimary: itemSeed.isPrimary ?? true,
        sortOrder: itemSeed.sortOrder ?? 0,
      },
    });
  }
}

function toJson(
  value: Record<string, unknown> | undefined,
): Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
}
