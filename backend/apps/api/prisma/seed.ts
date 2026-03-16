import {
  AdminRole,
  ContentItemType,
  K12Stage,
  Prisma,
  PrismaClient,
  ReviewStatus,
  SemesterType,
  SubjectCode,
  TextbookNodeType,
} from '@prisma/client';
import { hashPassword } from '../src/common/utils/password-hash';
import { SUBJECT_SEEDS } from '../src/subjects/subject-seeds';
import { seedExternalTextbookDatasets } from './textbook-seed-loader';

const prisma = new PrismaClient();

type PublisherSeed = {
  code: string;
  name: string;
  shortName: string;
  region: string;
};

type EditionSeed = {
  subjectCode: SubjectCode;
  publisherCode: string;
  code: string;
  displayName: string;
  curriculumYear: number;
  regionScope: string;
};

type VolumeSeed = {
  editionCode: string;
  grade: number;
  semester: SemesterType;
  volumeLabel: string;
  k12Stage: K12Stage;
  sortOrder: number;
  version: number;
};

type NodeSeed = {
  volumeKey: string;
  nodeCode: string;
  parentCode: string | null;
  nodeType: TextbookNodeType;
  title: string;
  description?: string;
  sortOrder: number;
  isLeaf: boolean;
  metadata?: Record<string, unknown>;
};

type KnowledgePointSeed = {
  subjectCode: SubjectCode;
  code: string;
  name: string;
  description: string;
  difficultyLevel: number;
  k12Stage: K12Stage;
};

type ContentItemSeed = {
  subjectCode: SubjectCode;
  canonicalKey: string;
  itemType: ContentItemType;
  title: string;
  summary: string;
  difficultyLevel: number;
  k12Stage: K12Stage;
  payload: Record<string, unknown>;
};

type AdminUserSeed = {
  username: string;
  displayName: string;
  password: string;
  role: AdminRole;
};

const PUBLISHERS: PublisherSeed[] = [
  {
    code: 'RJB',
    name: '人民教育出版社',
    shortName: '人教社',
    region: 'CN',
  },
  {
    code: 'SUJ',
    name: '江苏凤凰教育出版社',
    shortName: '苏教',
    region: 'CN',
  },
  {
    code: 'BSD',
    name: '北京师范大学出版社',
    shortName: '北师大',
    region: 'CN',
  },
];

const EDITIONS: EditionSeed[] = [
  {
    subjectCode: SubjectCode.CHINESE,
    publisherCode: 'RJB',
    code: 'CHINESE_RJB_2024',
    displayName: '语文 人教版 2024',
    curriculumYear: 2024,
    regionScope: '全国',
  },
  {
    subjectCode: SubjectCode.CHINESE,
    publisherCode: 'SUJ',
    code: 'CHINESE_SUJ_2024',
    displayName: '语文 苏教版 2024',
    curriculumYear: 2024,
    regionScope: '江苏',
  },
  {
    subjectCode: SubjectCode.CHINESE,
    publisherCode: 'BSD',
    code: 'CHINESE_BSD_2024',
    displayName: '语文 北师大版 2024',
    curriculumYear: 2024,
    regionScope: '全国',
  },
  {
    subjectCode: SubjectCode.MATH,
    publisherCode: 'RJB',
    code: 'MATH_RJB_2024',
    displayName: '数学 人教版 2024',
    curriculumYear: 2024,
    regionScope: '全国',
  },
  {
    subjectCode: SubjectCode.ENGLISH,
    publisherCode: 'RJB',
    code: 'ENGLISH_RJB_2024',
    displayName: '英语 人教版 2024',
    curriculumYear: 2024,
    regionScope: '全国',
  },
];

const VOLUMES: VolumeSeed[] = [
  {
    editionCode: 'CHINESE_RJB_2024',
    grade: 3,
    semester: SemesterType.FIRST_TERM,
    volumeLabel: '三年级上册',
    k12Stage: K12Stage.MIDDLE_PRIMARY,
    sortOrder: 1,
    version: 1,
  },
  {
    editionCode: 'CHINESE_RJB_2024',
    grade: 3,
    semester: SemesterType.SECOND_TERM,
    volumeLabel: '三年级下册',
    k12Stage: K12Stage.MIDDLE_PRIMARY,
    sortOrder: 2,
    version: 1,
  },
  {
    editionCode: 'CHINESE_SUJ_2024',
    grade: 3,
    semester: SemesterType.FIRST_TERM,
    volumeLabel: '三年级上册',
    k12Stage: K12Stage.MIDDLE_PRIMARY,
    sortOrder: 1,
    version: 1,
  },
  {
    editionCode: 'CHINESE_BSD_2024',
    grade: 3,
    semester: SemesterType.FIRST_TERM,
    volumeLabel: '三年级上册',
    k12Stage: K12Stage.MIDDLE_PRIMARY,
    sortOrder: 1,
    version: 1,
  },
  {
    editionCode: 'MATH_RJB_2024',
    grade: 3,
    semester: SemesterType.FIRST_TERM,
    volumeLabel: '三年级上册',
    k12Stage: K12Stage.MIDDLE_PRIMARY,
    sortOrder: 1,
    version: 1,
  },
  {
    editionCode: 'ENGLISH_RJB_2024',
    grade: 3,
    semester: SemesterType.FIRST_TERM,
    volumeLabel: '三年级上册',
    k12Stage: K12Stage.MIDDLE_PRIMARY,
    sortOrder: 1,
    version: 1,
  },
];

const NODES: NodeSeed[] = [
  {
    volumeKey: 'CHINESE_RJB_2024:3:FIRST_TERM:1',
    nodeCode: 'VOL_ROOT',
    parentCode: null,
    nodeType: TextbookNodeType.VOLUME,
    title: '三年级上册',
    description: '语文人教版三年级上册目录根节点',
    sortOrder: 1,
    isLeaf: false,
  },
  {
    volumeKey: 'CHINESE_RJB_2024:3:FIRST_TERM:1',
    nodeCode: 'UNIT_1',
    parentCode: 'VOL_ROOT',
    nodeType: TextbookNodeType.UNIT,
    title: '第一单元 校园与成长',
    description: '围绕校园生活、观察表达与朗读展开',
    sortOrder: 10,
    isLeaf: false,
  },
  {
    volumeKey: 'CHINESE_RJB_2024:3:FIRST_TERM:1',
    nodeCode: 'UNIT_1_LESSON_1',
    parentCode: 'UNIT_1',
    nodeType: TextbookNodeType.LESSON,
    title: '第1课 晨读与表达',
    description: '训练自然朗读与句子复述',
    sortOrder: 11,
    isLeaf: true,
    metadata: {
      estimatedMinutes: 20,
    },
  },
  {
    volumeKey: 'CHINESE_RJB_2024:3:FIRST_TERM:1',
    nodeCode: 'UNIT_1_LESSON_2',
    parentCode: 'UNIT_1',
    nodeType: TextbookNodeType.LESSON,
    title: '第2课 生字与结构',
    description: '训练生字识记、偏旁和书写规则',
    sortOrder: 12,
    isLeaf: true,
    metadata: {
      estimatedMinutes: 18,
    },
  },
  {
    volumeKey: 'CHINESE_RJB_2024:3:FIRST_TERM:1',
    nodeCode: 'UNIT_2',
    parentCode: 'VOL_ROOT',
    nodeType: TextbookNodeType.UNIT,
    title: '第二单元 诗意与想象',
    description: '围绕古诗朗读和意象理解展开',
    sortOrder: 20,
    isLeaf: false,
  },
  {
    volumeKey: 'CHINESE_RJB_2024:3:FIRST_TERM:1',
    nodeCode: 'UNIT_2_LESSON_1',
    parentCode: 'UNIT_2',
    nodeType: TextbookNodeType.LESSON,
    title: '第3课 古诗晨景',
    description: '理解古诗节奏与画面感',
    sortOrder: 21,
    isLeaf: true,
    metadata: {
      estimatedMinutes: 15,
    },
  },
  {
    volumeKey: 'CHINESE_RJB_2024:3:FIRST_TERM:1',
    nodeCode: 'UNIT_2_LESSON_2',
    parentCode: 'UNIT_2',
    nodeType: TextbookNodeType.LESSON,
    title: '第4课 单元整合练习',
    description: '结合朗读、识字与表达做综合练习',
    sortOrder: 22,
    isLeaf: true,
    metadata: {
      estimatedMinutes: 25,
    },
  },
];

const KNOWLEDGE_POINTS: KnowledgePointSeed[] = [
  {
    subjectCode: SubjectCode.CHINESE,
    code: 'CHN_G3_READING_FLUENCY',
    name: '自然朗读与停顿',
    description: '能按句意进行自然停顿和重音处理',
    difficultyLevel: 1,
    k12Stage: K12Stage.MIDDLE_PRIMARY,
  },
  {
    subjectCode: SubjectCode.CHINESE,
    code: 'CHN_G3_CHARACTER_FORM',
    name: '偏旁部首与字形结构',
    description: '识别常见偏旁，理解左右和上下结构',
    difficultyLevel: 2,
    k12Stage: K12Stage.MIDDLE_PRIMARY,
  },
  {
    subjectCode: SubjectCode.CHINESE,
    code: 'CHN_G3_POEM_IMAGERY',
    name: '古诗意象理解',
    description: '结合画面理解诗句中的季节、景物和情绪',
    difficultyLevel: 2,
    k12Stage: K12Stage.MIDDLE_PRIMARY,
  },
];

const CONTENT_ITEMS: ContentItemSeed[] = [
  {
    subjectCode: SubjectCode.CHINESE,
    canonicalKey: 'chinese-g3-ft-unit1-lesson1-text',
    itemType: ContentItemType.TEXT,
    title: '晨读与表达 示例课文',
    summary: '用于朗读训练和句子复述的短文',
    difficultyLevel: 1,
    k12Stage: K12Stage.MIDDLE_PRIMARY,
    payload: {
      objectives: ['完成自然朗读', '用自己的话复述段落内容'],
      blocks: [
        {
          type: 'paragraph',
          text: '清晨，阳光落在教室窗边，同学们开始大声晨读。',
        },
        {
          type: 'paragraph',
          text: '老师提醒大家先看清句子，再根据意思停顿。',
        },
      ],
    },
  },
  {
    subjectCode: SubjectCode.CHINESE,
    canonicalKey: 'chinese-g3-ft-unit1-lesson1-exercise',
    itemType: ContentItemType.EXERCISE,
    title: '晨读与表达 练习',
    summary: '检验朗读和复述效果的练习题',
    difficultyLevel: 1,
    k12Stage: K12Stage.MIDDLE_PRIMARY,
    payload: {
      questions: [
        {
          type: 'short_answer',
          prompt: '用一句话概括这段短文讲了什么。',
        },
        {
          type: 'multiple_choice',
          prompt: '朗读时应该先做什么？',
          options: ['先看清句子', '直接加快速度', '跳过不认识的字'],
          answer: '先看清句子',
        },
      ],
    },
  },
  {
    subjectCode: SubjectCode.CHINESE,
    canonicalKey: 'chinese-g3-ft-unit1-lesson2-character',
    itemType: ContentItemType.CHARACTER,
    title: '生字与结构 生字包',
    summary: '训练偏旁部首和书写结构的生字集合',
    difficultyLevel: 2,
    k12Stage: K12Stage.MIDDLE_PRIMARY,
    payload: {
      characters: [
        { value: '晨', radical: '日', structure: '上下' },
        { value: '读', radical: '讠', structure: '左右' },
        { value: '窗', radical: '穴', structure: '上下' },
      ],
    },
  },
  {
    subjectCode: SubjectCode.CHINESE,
    canonicalKey: 'chinese-g3-ft-unit2-lesson1-text',
    itemType: ContentItemType.TEXT,
    title: '古诗晨景 赏读材料',
    summary: '帮助学生把古诗和画面联系起来',
    difficultyLevel: 2,
    k12Stage: K12Stage.MIDDLE_PRIMARY,
    payload: {
      poemTitle: '春晓',
      lines: ['春眠不觉晓', '处处闻啼鸟', '夜来风雨声', '花落知多少'],
      guidance: ['先听节奏', '再说画面', '最后说感受'],
    },
  },
  {
    subjectCode: SubjectCode.CHINESE,
    canonicalKey: 'chinese-g3-ft-unit2-review',
    itemType: ContentItemType.EXERCISE,
    title: '诗意与想象 单元练习',
    summary: '综合评估朗读、识字和意象理解',
    difficultyLevel: 2,
    k12Stage: K12Stage.MIDDLE_PRIMARY,
    payload: {
      tasks: [
        {
          type: 'recite',
          prompt: '按节奏朗读古诗，并说出你看到的画面。',
        },
        {
          type: 'match',
          prompt: '将“啼鸟、风雨、花落”与对应画面连线。',
        },
      ],
    },
  },
];

const ADMIN_USERS: AdminUserSeed[] = [
  {
    username: 'admin',
    displayName: '系统管理员',
    password: 'Admin@123456',
    role: AdminRole.SUPER_ADMIN,
  },
];

async function main() {
  const subjectMap = await seedSubjects();
  const publisherMap = await seedPublishers();
  const editionMap = await seedEditions(subjectMap, publisherMap);
  const volumeMap = await seedVolumes(editionMap);
  const nodeMap = await seedNodes(volumeMap);
  const knowledgePointMap = await seedKnowledgePoints(subjectMap);
  const contentItemMap = await seedContentItems(subjectMap);
  const seededAdminUsers = await seedAdminUsers();

  await attachKnowledgePoints(nodeMap, knowledgePointMap);
  await attachContentItems(nodeMap, contentItemMap);
  await seedExternalTextbookDatasets(prisma);

  console.log(
    JSON.stringify(
      {
        seededSubjects: Object.keys(subjectMap).length,
        seededPublishers: Object.keys(publisherMap).length,
        seededEditions: Object.keys(editionMap).length,
        seededVolumes: Object.keys(volumeMap).length,
        seededNodes: Object.keys(nodeMap).length,
        seededKnowledgePoints: Object.keys(knowledgePointMap).length,
        seededContentItems: Object.keys(contentItemMap).length,
        seededAdminUsers,
      },
      null,
      2,
    ),
  );
}

async function seedAdminUsers() {
  for (const adminUser of ADMIN_USERS) {
    await prisma.adminUser.upsert({
      where: {
        username: adminUser.username,
      },
      update: {
        displayName: adminUser.displayName,
        passwordHash: hashPassword(adminUser.password),
        role: adminUser.role,
        isEnabled: true,
      },
      create: {
        username: adminUser.username,
        displayName: adminUser.displayName,
        passwordHash: hashPassword(adminUser.password),
        role: adminUser.role,
        isEnabled: true,
      },
    });
  }

  return ADMIN_USERS.length;
}

async function seedSubjects() {
  const entries = await Promise.all(
    SUBJECT_SEEDS.map(async (seed) => {
      const subject = await prisma.subject.upsert({
        where: { code: seed.code },
        update: {
          name: seed.name,
          description: seed.description,
          sortOrder: seed.sortOrder,
          isEnabled: true,
        },
        create: {
          code: seed.code,
          name: seed.name,
          description: seed.description,
          sortOrder: seed.sortOrder,
          isEnabled: true,
        },
      });

      return [seed.code, subject] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<
    SubjectCode,
    Awaited<ReturnType<typeof prisma.subject.upsert>>
  >;
}

async function seedPublishers() {
  const entries = await Promise.all(
    PUBLISHERS.map(async (seed) => {
      const publisher = await prisma.publisher.upsert({
        where: { code: seed.code },
        update: {
          name: seed.name,
          shortName: seed.shortName,
          region: seed.region,
          isEnabled: true,
        },
        create: {
          code: seed.code,
          name: seed.name,
          shortName: seed.shortName,
          region: seed.region,
          isEnabled: true,
        },
      });

      return [seed.code, publisher] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<
    string,
    Awaited<ReturnType<typeof prisma.publisher.upsert>>
  >;
}

async function seedEditions(
  subjectMap: Record<SubjectCode, { id: string }>,
  publisherMap: Record<string, { id: string }>,
) {
  const entries = await Promise.all(
    EDITIONS.map(async (seed) => {
      const edition = await prisma.textbookEdition.upsert({
        where: {
          subjectId_code: {
            subjectId: subjectMap[seed.subjectCode].id,
            code: seed.code,
          },
        },
        update: {
          publisherId: publisherMap[seed.publisherCode].id,
          displayName: seed.displayName,
          curriculumYear: seed.curriculumYear,
          regionScope: seed.regionScope,
          isEnabled: true,
        },
        create: {
          subjectId: subjectMap[seed.subjectCode].id,
          publisherId: publisherMap[seed.publisherCode].id,
          code: seed.code,
          displayName: seed.displayName,
          curriculumYear: seed.curriculumYear,
          regionScope: seed.regionScope,
          isEnabled: true,
        },
      });

      return [seed.code, edition] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<
    string,
    Awaited<ReturnType<typeof prisma.textbookEdition.upsert>>
  >;
}

async function seedVolumes(editionMap: Record<string, { id: string }>) {
  const publishedAt = new Date();
  const entries = await Promise.all(
    VOLUMES.map(async (seed) => {
      const volume = await prisma.textbookVolume.upsert({
        where: {
          editionId_grade_semester_version: {
            editionId: editionMap[seed.editionCode].id,
            grade: seed.grade,
            semester: seed.semester,
            version: seed.version,
          },
        },
        update: {
          volumeLabel: seed.volumeLabel,
          k12Stage: seed.k12Stage,
          sortOrder: seed.sortOrder,
          reviewStatus: ReviewStatus.PUBLISHED,
          publishedAt,
        },
        create: {
          editionId: editionMap[seed.editionCode].id,
          grade: seed.grade,
          semester: seed.semester,
          volumeLabel: seed.volumeLabel,
          k12Stage: seed.k12Stage,
          sortOrder: seed.sortOrder,
          version: seed.version,
          reviewStatus: ReviewStatus.PUBLISHED,
          publishedAt,
        },
      });

      return [volumeKey(seed), volume] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<
    string,
    Awaited<ReturnType<typeof prisma.textbookVolume.upsert>>
  >;
}

async function seedNodes(volumeMap: Record<string, { id: string }>) {
  const nodeMap: Record<string, { id: string; volumeId: string }> = {};
  const sortedSeeds = [...NODES].sort((left, right) => {
    if (left.parentCode === right.parentCode) {
      return left.sortOrder - right.sortOrder;
    }
    if (left.parentCode === null) {
      return -1;
    }
    if (right.parentCode === null) {
      return 1;
    }
    return left.sortOrder - right.sortOrder;
  });

  for (const seed of sortedSeeds) {
    const volume = volumeMap[seed.volumeKey];
    const parent = seed.parentCode
      ? nodeMap[nodeKey(seed.volumeKey, seed.parentCode)]
      : null;
    const depth = parent ? await getNodeDepth(parent.id) + 1 : 1;
    const existing = await prisma.textbookNode.findFirst({
      where: {
        volumeId: volume.id,
        nodeCode: seed.nodeCode,
      },
      select: {
        id: true,
      },
    });

    const node = existing
      ? await prisma.textbookNode.update({
          where: { id: existing.id },
          data: {
            parentId: parent?.id ?? null,
            nodeType: seed.nodeType,
            title: seed.title,
            description: seed.description ?? null,
            depth,
            sortOrder: seed.sortOrder,
            reviewStatus: ReviewStatus.PUBLISHED,
            version: 1,
            isLeaf: seed.isLeaf,
            metadataJson: toJson(seed.metadata),
          },
        })
      : await prisma.textbookNode.create({
          data: {
            volumeId: volume.id,
            parentId: parent?.id ?? null,
            nodeType: seed.nodeType,
            nodeCode: seed.nodeCode,
            title: seed.title,
            description: seed.description ?? null,
            depth,
            sortOrder: seed.sortOrder,
            reviewStatus: ReviewStatus.PUBLISHED,
            version: 1,
            isLeaf: seed.isLeaf,
            metadataJson: toJson(seed.metadata),
          },
        });

    nodeMap[nodeKey(seed.volumeKey, seed.nodeCode)] = {
      id: node.id,
      volumeId: node.volumeId,
    };
  }

  return nodeMap;
}

async function seedKnowledgePoints(subjectMap: Record<SubjectCode, { id: string }>) {
  const entries = await Promise.all(
    KNOWLEDGE_POINTS.map(async (seed) => {
      const knowledgePoint = await prisma.knowledgePoint.upsert({
        where: {
          subjectId_code: {
            subjectId: subjectMap[seed.subjectCode].id,
            code: seed.code,
          },
        },
        update: {
          name: seed.name,
          description: seed.description,
          difficultyLevel: seed.difficultyLevel,
          k12Stage: seed.k12Stage,
          isEnabled: true,
        },
        create: {
          subjectId: subjectMap[seed.subjectCode].id,
          code: seed.code,
          name: seed.name,
          description: seed.description,
          difficultyLevel: seed.difficultyLevel,
          k12Stage: seed.k12Stage,
          isEnabled: true,
        },
      });

      return [seed.code, knowledgePoint] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<
    string,
    Awaited<ReturnType<typeof prisma.knowledgePoint.upsert>>
  >;
}

async function seedContentItems(subjectMap: Record<SubjectCode, { id: string }>) {
  const entries = await Promise.all(
    CONTENT_ITEMS.map(async (seed) => {
      const existing = await prisma.contentItem.findFirst({
        where: {
          subjectId: subjectMap[seed.subjectCode].id,
          canonicalKey: seed.canonicalKey,
        },
        select: {
          id: true,
        },
      });

      const contentItem = existing
        ? await prisma.contentItem.update({
            where: { id: existing.id },
            data: {
              itemType: seed.itemType,
              title: seed.title,
              summary: seed.summary,
              difficultyLevel: seed.difficultyLevel,
              k12Stage: seed.k12Stage,
              isReusable: true,
            },
          })
        : await prisma.contentItem.create({
            data: {
              subjectId: subjectMap[seed.subjectCode].id,
              itemType: seed.itemType,
              canonicalKey: seed.canonicalKey,
              title: seed.title,
              summary: seed.summary,
              difficultyLevel: seed.difficultyLevel,
              k12Stage: seed.k12Stage,
              isReusable: true,
              currentVersion: 1,
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
          title: seed.title,
          payloadJson: toJson(seed.payload),
          reviewStatus: ReviewStatus.PUBLISHED,
          publishedAt: new Date(),
          changeSummary: 'seed bootstrap content',
        },
        create: {
          contentItemId: contentItem.id,
          version: 1,
          title: seed.title,
          payloadJson: toJson(seed.payload),
          reviewStatus: ReviewStatus.PUBLISHED,
          publishedAt: new Date(),
          changeSummary: 'seed bootstrap content',
        },
      });

      await prisma.contentItem.update({
        where: { id: contentItem.id },
        data: {
          currentVersion: version.version,
          currentVersionId: version.id,
        },
      });

      return [
        seed.canonicalKey,
        {
          id: contentItem.id,
          versionId: version.id,
        },
      ] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<
    string,
    { id: string; versionId: string }
  >;
}

async function attachKnowledgePoints(
  nodeMap: Record<string, { id: string }>,
  knowledgePointMap: Record<string, { id: string }>,
) {
  await prisma.textbookNodeKnowledgePoint.upsert({
    where: {
      textbookNodeId_knowledgePointId: {
        textbookNodeId: nodeMap[
          nodeKey('CHINESE_RJB_2024:3:FIRST_TERM:1', 'UNIT_1_LESSON_1')
        ].id,
        knowledgePointId: knowledgePointMap.CHN_G3_READING_FLUENCY.id,
      },
    },
    update: {
      relationType: 'PRIMARY',
      sortOrder: 1,
    },
    create: {
      textbookNodeId: nodeMap[
        nodeKey('CHINESE_RJB_2024:3:FIRST_TERM:1', 'UNIT_1_LESSON_1')
      ].id,
      knowledgePointId: knowledgePointMap.CHN_G3_READING_FLUENCY.id,
      relationType: 'PRIMARY',
      sortOrder: 1,
    },
  });

  await prisma.textbookNodeKnowledgePoint.upsert({
    where: {
      textbookNodeId_knowledgePointId: {
        textbookNodeId: nodeMap[
          nodeKey('CHINESE_RJB_2024:3:FIRST_TERM:1', 'UNIT_1_LESSON_2')
        ].id,
        knowledgePointId: knowledgePointMap.CHN_G3_CHARACTER_FORM.id,
      },
    },
    update: {
      relationType: 'PRIMARY',
      sortOrder: 1,
    },
    create: {
      textbookNodeId: nodeMap[
        nodeKey('CHINESE_RJB_2024:3:FIRST_TERM:1', 'UNIT_1_LESSON_2')
      ].id,
      knowledgePointId: knowledgePointMap.CHN_G3_CHARACTER_FORM.id,
      relationType: 'PRIMARY',
      sortOrder: 1,
    },
  });

  await prisma.textbookNodeKnowledgePoint.upsert({
    where: {
      textbookNodeId_knowledgePointId: {
        textbookNodeId: nodeMap[
          nodeKey('CHINESE_RJB_2024:3:FIRST_TERM:1', 'UNIT_2_LESSON_1')
        ].id,
        knowledgePointId: knowledgePointMap.CHN_G3_POEM_IMAGERY.id,
      },
    },
    update: {
      relationType: 'PRIMARY',
      sortOrder: 1,
    },
    create: {
      textbookNodeId: nodeMap[
        nodeKey('CHINESE_RJB_2024:3:FIRST_TERM:1', 'UNIT_2_LESSON_1')
      ].id,
      knowledgePointId: knowledgePointMap.CHN_G3_POEM_IMAGERY.id,
      relationType: 'PRIMARY',
      sortOrder: 1,
    },
  });
}

async function attachContentItems(
  nodeMap: Record<string, { id: string }>,
  contentItemMap: Record<string, { id: string; versionId: string }>,
) {
  await upsertNodeContentLink(
    nodeMap[nodeKey('CHINESE_RJB_2024:3:FIRST_TERM:1', 'UNIT_1_LESSON_1')].id,
    contentItemMap['chinese-g3-ft-unit1-lesson1-text'].id,
    contentItemMap['chinese-g3-ft-unit1-lesson1-text'].versionId,
    true,
    1,
  );
  await upsertNodeContentLink(
    nodeMap[nodeKey('CHINESE_RJB_2024:3:FIRST_TERM:1', 'UNIT_1_LESSON_1')].id,
    contentItemMap['chinese-g3-ft-unit1-lesson1-exercise'].id,
    contentItemMap['chinese-g3-ft-unit1-lesson1-exercise'].versionId,
    false,
    2,
  );
  await upsertNodeContentLink(
    nodeMap[nodeKey('CHINESE_RJB_2024:3:FIRST_TERM:1', 'UNIT_1_LESSON_2')].id,
    contentItemMap['chinese-g3-ft-unit1-lesson2-character'].id,
    contentItemMap['chinese-g3-ft-unit1-lesson2-character'].versionId,
    true,
    1,
  );
  await upsertNodeContentLink(
    nodeMap[nodeKey('CHINESE_RJB_2024:3:FIRST_TERM:1', 'UNIT_2_LESSON_1')].id,
    contentItemMap['chinese-g3-ft-unit2-lesson1-text'].id,
    contentItemMap['chinese-g3-ft-unit2-lesson1-text'].versionId,
    true,
    1,
  );
  await upsertNodeContentLink(
    nodeMap[nodeKey('CHINESE_RJB_2024:3:FIRST_TERM:1', 'UNIT_2_LESSON_2')].id,
    contentItemMap['chinese-g3-ft-unit2-review'].id,
    contentItemMap['chinese-g3-ft-unit2-review'].versionId,
    true,
    1,
  );

  await upsertContentKnowledgeLink(
    contentItemMap['chinese-g3-ft-unit1-lesson1-text'].id,
    'CHN_G3_READING_FLUENCY',
  );
  await upsertContentKnowledgeLink(
    contentItemMap['chinese-g3-ft-unit1-lesson2-character'].id,
    'CHN_G3_CHARACTER_FORM',
  );
  await upsertContentKnowledgeLink(
    contentItemMap['chinese-g3-ft-unit2-lesson1-text'].id,
    'CHN_G3_POEM_IMAGERY',
  );
}

async function upsertNodeContentLink(
  textbookNodeId: string,
  contentItemId: string,
  contentVersionId: string,
  isPrimary: boolean,
  sortOrder: number,
) {
  await prisma.textbookNodeContentItem.upsert({
    where: {
      textbookNodeId_contentItemId: {
        textbookNodeId,
        contentItemId,
      },
    },
    update: {
      contentVersionId,
      isPrimary,
      sortOrder,
    },
    create: {
      textbookNodeId,
      contentItemId,
      contentVersionId,
      isPrimary,
      sortOrder,
    },
  });
}

async function upsertContentKnowledgeLink(
  contentItemId: string,
  knowledgePointCode: string,
) {
  const knowledgePoint = await prisma.knowledgePoint.findFirstOrThrow({
    where: {
      code: knowledgePointCode,
    },
    select: {
      id: true,
    },
  });

  await prisma.contentItemKnowledgePoint.upsert({
    where: {
      contentItemId_knowledgePointId: {
        contentItemId,
        knowledgePointId: knowledgePoint.id,
      },
    },
    update: {
      relationType: 'PRIMARY',
    },
    create: {
      contentItemId,
      knowledgePointId: knowledgePoint.id,
      relationType: 'PRIMARY',
    },
  });
}

async function getNodeDepth(nodeId: string) {
  const node = await prisma.textbookNode.findUniqueOrThrow({
    where: { id: nodeId },
    select: {
      depth: true,
    },
  });

  return node.depth;
}

function volumeKey(seed: VolumeSeed) {
  return `${seed.editionCode}:${seed.grade}:${seed.semester}:${seed.version}`;
}

function nodeKey(volumeId: string, nodeCode: string) {
  return `${volumeId}:${nodeCode}`;
}

function toJson(value: Record<string, unknown> | undefined): Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
