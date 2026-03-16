import { BadRequestException, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { ApiExceptionFilter } from '../src/common/filters/api-exception.filter';
import { PrismaService } from '../src/persistence/prisma/prisma.service';

jest.setTimeout(120000);

describe('Textbook content persistence flow (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new ApiExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        exceptionFactory: (errors) =>
          new BadRequestException({
            code: 'VALIDATION_ERROR',
            message: 'request validation failed',
            details: errors.map((error) => ({
              field: error.property,
              errors: Object.values(error.constraints ?? {}),
            })),
          }),
      }),
    );
    await app.init();

    prismaService = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('persists content ops writes and supports textbook query plus child binding flow', async () => {
    const suffix = `${Date.now()}`;
    const phone = `1${suffix.slice(-10)}`;

    await request(app.getHttpServer())
      .post('/api/auth/send-code')
      .send({ phone })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone, verificationCode: '123456' })
      .expect(201);

    const accessToken = loginResponse.body.accessToken as string;
    const authHeader = {
      Authorization: `Bearer ${accessToken}`,
    };

    const childResponse = await request(app.getHttpServer())
      .post('/api/children')
      .set(authHeader)
      .send({
        name: 'TextbookTester',
        gender: 'MALE',
        grade: 3,
      })
      .expect(201);

    const childId = childResponse.body.id as string;

    const publisherCode = `TEST_PUB_${suffix}`;
    const editionCode = `TEST_CHINESE_${suffix}`;
    const knowledgePointCode = `TEST_KP_${suffix}`;
    const canonicalKey = `test-content-${suffix}`;

    const publisherResponse = await request(app.getHttpServer())
      .post('/api/content-ops/publishers')
      .set(authHeader)
      .send({
        code: publisherCode,
        name: `测试出版社${suffix}`,
        shortName: '测试社',
        region: 'CN',
      })
      .expect(201);

    expect(publisherResponse.body.code).toBe(publisherCode);

    const editionResponse = await request(app.getHttpServer())
      .post('/api/content-ops/textbooks/editions')
      .set(authHeader)
      .send({
        subjectCode: 'CHINESE',
        publisherCode,
        code: editionCode,
        displayName: `测试语文版 ${suffix}`,
        curriculumYear: 2026,
        regionScope: '测试区域',
      })
      .expect(201);

    const editionId = editionResponse.body.id as string;

    const volumeResponse = await request(app.getHttpServer())
      .post(`/api/content-ops/textbooks/editions/${editionId}/volumes`)
      .set(authHeader)
      .send({
        grade: 3,
        semester: 'FIRST_TERM',
        volumeLabel: '测试三年级上册',
        k12Stage: 'MIDDLE_PRIMARY',
        sortOrder: 1,
        version: 1,
      })
      .expect(201);

    const volumeId = volumeResponse.body.id as string;

    const rootNodeResponse = await request(app.getHttpServer())
      .post(`/api/content-ops/textbooks/volumes/${volumeId}/nodes`)
      .set(authHeader)
      .send({
        nodeType: 'VOLUME',
        nodeCode: `ROOT_${suffix}`,
        title: '测试册别根节点',
        description: '用于持久化接口验证',
        sortOrder: 1,
        isLeaf: false,
      })
      .expect(201);

    const rootNodeId = rootNodeResponse.body.id as string;

    const lessonNodeResponse = await request(app.getHttpServer())
      .post(`/api/content-ops/textbooks/volumes/${volumeId}/nodes`)
      .set(authHeader)
      .send({
        parentId: rootNodeId,
        nodeType: 'LESSON',
        nodeCode: `LESSON_${suffix}`,
        title: '测试第一课',
        description: '用于验证课节点内容挂载',
        sortOrder: 2,
        isLeaf: true,
        metadata: {
          estimatedMinutes: 12,
        },
      })
      .expect(201);

    const lessonNodeId = lessonNodeResponse.body.id as string;

    const knowledgePointResponse = await request(app.getHttpServer())
      .post('/api/content-ops/knowledge-points')
      .set(authHeader)
      .send({
        subjectCode: 'CHINESE',
        code: knowledgePointCode,
        name: '测试知识点',
        description: '验证知识点落库',
        difficultyLevel: 2,
        k12Stage: 'MIDDLE_PRIMARY',
        tags: {
          category: 'e2e',
        },
      })
      .expect(201);

    const knowledgePointId = knowledgePointResponse.body.id as string;

    const contentItemResponse = await request(app.getHttpServer())
      .post('/api/content-ops/content-items')
      .set(authHeader)
      .send({
        subjectCode: 'CHINESE',
        itemType: 'TEXT',
        canonicalKey,
        title: '测试课文内容',
        summary: '用于验证内容项和版本持久化',
        difficultyLevel: 2,
        k12Stage: 'MIDDLE_PRIMARY',
        isReusable: true,
      })
      .expect(201);

    const contentItemId = contentItemResponse.body.id as string;

    const versionResponse = await request(app.getHttpServer())
      .post(`/api/content-ops/content-items/${contentItemId}/versions`)
      .set(authHeader)
      .send({
        title: '测试课文内容 v1',
        payload: {
          blocks: [
            {
              type: 'paragraph',
              text: '这是一条真实 PostgreSQL 持久化测试内容。',
            },
          ],
        },
        changeSummary: 'initial e2e content',
      })
      .expect(201);

    const versionId = versionResponse.body.id as string;

    await request(app.getHttpServer())
      .post(`/api/content-ops/textbooks/nodes/${lessonNodeId}/knowledge-points`)
      .set(authHeader)
      .send({
        knowledgePointId,
        relationType: 'PRIMARY',
        sortOrder: 1,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/content-ops/textbooks/nodes/${lessonNodeId}/content-items`)
      .set(authHeader)
      .send({
        contentItemId,
        contentVersionId: versionId,
        isPrimary: true,
        sortOrder: 1,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/content-ops/content-items/${contentItemId}/publish`)
      .set(authHeader)
      .send({
        versionId,
      })
      .expect(201);

    const createdNode = await prismaService.textbookNode.findUniqueOrThrow({
      where: {
        id: lessonNodeId,
      },
    });
    expect(createdNode.title).toBe('测试第一课');
    expect(createdNode.parentId).toBe(rootNodeId);

    const createdVersion = await prismaService.contentItemVersion.findUniqueOrThrow({
      where: {
        id: versionId,
      },
    });
    expect(createdVersion.reviewStatus).toBe('PUBLISHED');

    const treeResponse = await request(app.getHttpServer())
      .get(`/api/textbooks/volumes/${volumeId}/tree`)
      .expect(200);

    expect(treeResponse.body.nodes).toHaveLength(1);
    expect(treeResponse.body.nodes[0].children[0].title).toBe('测试第一课');

    const nodeContentItemsResponse = await request(app.getHttpServer())
      .get(`/api/textbooks/nodes/${lessonNodeId}/content-items`)
      .query({ includeDraft: false })
      .expect(200);

    expect(nodeContentItemsResponse.body).toHaveLength(1);
    expect(nodeContentItemsResponse.body[0].id).toBe(contentItemId);
    expect(nodeContentItemsResponse.body[0].contentVersionId).toBe(versionId);

    const nodeKnowledgePointsResponse = await request(app.getHttpServer())
      .get(`/api/textbooks/nodes/${lessonNodeId}/knowledge-points`)
      .expect(200);

    expect(nodeKnowledgePointsResponse.body).toHaveLength(1);
    expect(nodeKnowledgePointsResponse.body[0].id).toBe(knowledgePointId);

    const seededEditionListResponse = await request(app.getHttpServer())
      .get('/api/textbooks/editions')
      .query({ subjectCode: 'CHINESE' })
      .expect(200);

    expect(seededEditionListResponse.body.length).toBeGreaterThan(0);
    const seededEdition = seededEditionListResponse.body.find(
      (item: { code: string }) => item.code === 'CHINESE_RJB_2024',
    );
    expect(seededEdition).toBeDefined();

    const seededVolumesResponse = await request(app.getHttpServer())
      .get(`/api/textbooks/editions/${seededEdition.id}/volumes`)
      .query({ publishedOnly: true, grade: 3, semester: 'FIRST_TERM' })
      .expect(200);

    expect(seededVolumesResponse.body.length).toBeGreaterThan(0);
    const seededVolumeId = seededVolumesResponse.body[0].id as string;

    const seededTreeResponse = await request(app.getHttpServer())
      .get(`/api/textbooks/volumes/${seededVolumeId}/tree`)
      .expect(200);

    const seededLessonNodeId = seededTreeResponse.body.nodes[0].children[0].children[0]
      .id as string;

    const bindingResponse = await request(app.getHttpServer())
      .post(`/api/children/${childId}/subjects/bindings`)
      .set(authHeader)
      .send({
        subjectCode: 'CHINESE',
        editionId: seededEdition.id,
        volumeId: seededVolumeId,
        grade: 3,
        semester: 'FIRST_TERM',
        currentNodeId: seededLessonNodeId,
        metadata: {
          source: 'e2e_binding',
        },
      })
      .expect(201);

    const bindingId = bindingResponse.body.id as string;
    expect(bindingResponse.body.currentNodeId).toBe(seededLessonNodeId);

    const progressUpdateResponse = await request(app.getHttpServer())
      .put(`/api/children/${childId}/subjects/bindings/${bindingId}/progress`)
      .set(authHeader)
      .send({
        currentNodeId: seededLessonNodeId,
        lastCompletedNodeId: seededLessonNodeId,
        completedNodeCount: 1,
      })
      .expect(200);

    expect(progressUpdateResponse.body.completedNodeCount).toBe(1);
    expect(progressUpdateResponse.body.currentNodeId).toBe(seededLessonNodeId);

    const persistedBinding = await prismaService.childSubjectBinding.findUniqueOrThrow({
      where: {
        id: bindingId,
      },
    });
    expect(persistedBinding.volumeId).toBe(seededVolumeId);
    expect(persistedBinding.currentNodeId).toBe(seededLessonNodeId);

    const persistedProgress = await prismaService.childSubjectProgress.findUniqueOrThrow({
      where: {
        childSubjectBindingId: bindingId,
      },
    });
    expect(persistedProgress.lastCompletedNodeId).toBe(seededLessonNodeId);
    expect(persistedProgress.completedNodeCount).toBe(1);
  });

  it('creates textbook push and task snapshots for children with active textbook bindings', async () => {
    const suffix = `${Date.now()}`;
    const phone = `1${suffix.slice(-10)}`;

    await request(app.getHttpServer())
      .post('/api/auth/send-code')
      .send({ phone })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone, verificationCode: '123456' })
      .expect(201);

    const accessToken = loginResponse.body.accessToken as string;
    const authHeader = {
      Authorization: `Bearer ${accessToken}`,
    };

    const childResponse = await request(app.getHttpServer())
      .post('/api/children')
      .set(authHeader)
      .send({
        name: 'PushBindingTester',
        gender: 'FEMALE',
        grade: 3,
      })
      .expect(201);

    const childId = childResponse.body.id as string;

    const editionListResponse = await request(app.getHttpServer())
      .get('/api/textbooks/editions')
      .query({ subjectCode: 'CHINESE' })
      .expect(200);

    const seededEdition = editionListResponse.body.find(
      (item: { code: string }) => item.code === 'CHINESE_RJB_2024',
    );
    expect(seededEdition).toBeDefined();

    const volumesResponse = await request(app.getHttpServer())
      .get(`/api/textbooks/editions/${seededEdition.id}/volumes`)
      .query({ publishedOnly: true, grade: 3, semester: 'FIRST_TERM' })
      .expect(200);

    const seededVolumeId = volumesResponse.body[0].id as string;

    const treeResponse = await request(app.getHttpServer())
      .get(`/api/textbooks/volumes/${seededVolumeId}/tree`)
      .expect(200);

    const seededLessonNodeId = treeResponse.body.nodes[0].children[0].children[0]
      .id as string;

    const bindingResponse = await request(app.getHttpServer())
      .post(`/api/children/${childId}/subjects/bindings`)
      .set(authHeader)
      .send({
        subjectCode: 'CHINESE',
        editionId: seededEdition.id,
        volumeId: seededVolumeId,
        grade: 3,
        semester: 'FIRST_TERM',
        currentNodeId: seededLessonNodeId,
        metadata: {
          source: 'push_flow_e2e',
        },
      })
      .expect(201);
    const bindingId = bindingResponse.body.id as string;

    const pendingPushesResponse = await request(app.getHttpServer())
      .get('/api/pushes/pending')
      .query({ childId })
      .set(authHeader)
      .expect(200);

    expect(pendingPushesResponse.body).toHaveLength(1);
    const push = pendingPushesResponse.body[0];
    expect(push.content.mode).toBe('textbook_content_review');
    expect(push.content.subjectCode).toBe('CHINESE');
    expect(push.content.contentItems.length).toBeGreaterThan(0);

    const persistedPush = await prismaService.learningPush.findUniqueOrThrow({
      where: {
        id: push.id,
      },
    });
    expect(persistedPush.textbookContextJson).toBeTruthy();
    expect(persistedPush.contentVersionSnapshotJson).toBeTruthy();

    await request(app.getHttpServer())
      .post(`/api/pushes/${push.id}/approve`)
      .set(authHeader)
      .send({ action: 'APPROVE' })
      .expect(201);

    const tasksResponse = await request(app.getHttpServer())
      .get(`/api/pushes/tasks/${childId}`)
      .set(authHeader)
      .expect(200);

    expect(tasksResponse.body).toHaveLength(1);
    expect(tasksResponse.body[0].content.mode).toBe('textbook_content_review');

    const persistedTask = await prismaService.learningTask.findFirstOrThrow({
      where: {
        pushId: push.id,
      },
    });
    expect(persistedTask.textbookContextJson).toBeTruthy();
    expect(persistedTask.contentVersionSnapshotJson).toBeTruthy();

    await request(app.getHttpServer())
      .post(`/api/pushes/${push.id}/deliver`)
      .set(authHeader)
      .expect(201);

    const sessionResponse = await request(app.getHttpServer())
      .post('/api/learning/sessions')
      .set(authHeader)
      .send({ taskId: persistedTask.id })
      .expect(201);

    expect(sessionResponse.body.subject).toBe('CHINESE');
    expect(sessionResponse.body.items.length).toBeGreaterThan(0);
    expect(sessionResponse.body.items[0].itemType).toBe('CONTENT_REVIEW');
    expect(
      sessionResponse.body.items.some(
        (item: { prompt: { answerMode?: string } }) =>
          item.prompt.answerMode === 'multiple_choice',
      ),
    ).toBe(true);

    const sessionId = sessionResponse.body.id as string;
    const persistedSessionItems = await prismaService.learningSessionItem.findMany({
      where: {
        sessionId,
      },
      orderBy: {
        sequence: 'asc',
      },
    });
    const correctAnswerByItemId = new Map(
      persistedSessionItems.map((item) => [
        item.id,
        item.correctAnswerJson as Record<string, unknown>,
      ]),
    );

    for (const item of sessionResponse.body.items as Array<{
      id: string;
      prompt: {
        answerMode?: string;
        options?: string[];
        prompt?: string;
      };
    }>) {
      const correctAnswer = correctAnswerByItemId.get(item.id) ?? {};
      const answer =
        item.prompt.answerMode === 'multiple_choice'
          ? {
              selected: correctAnswer.selected,
            }
          : item.prompt.answerMode === 'short_answer'
            ? {
                text: '这是一句简要回答。',
              }
            : {
                completed: true,
              };

      const answerResponse = await request(app.getHttpServer())
        .post(`/api/learning/sessions/${sessionId}/answer`)
        .set(authHeader)
        .send({
          sessionItemId: item.id,
          answer,
        })
        .expect(201);

      expect(answerResponse.body.isCorrect).toBe(true);
    }

    const finishResponse = await request(app.getHttpServer())
      .post(`/api/learning/sessions/${sessionId}/finish`)
      .set(authHeader)
      .expect(201);

    expect(finishResponse.body.status).toBe('COMPLETED');
    expect(finishResponse.body.summary.totalItems).toBe(sessionResponse.body.items.length);

    const completedTask = await prismaService.learningTask.findUniqueOrThrow({
      where: {
        id: persistedTask.id,
      },
    });
    expect(completedTask.status).toBe('COMPLETED');

    const updatedProgress = await prismaService.childSubjectProgress.findUniqueOrThrow({
      where: {
        childSubjectBindingId: bindingId,
      },
    });
    expect(updatedProgress.lastCompletedNodeId).toBe(seededLessonNodeId);
  });

  it('creates structured character questions for character content items', async () => {
    const suffix = `${Date.now()}`;
    const phone = `1${suffix.slice(-10)}`;

    await request(app.getHttpServer())
      .post('/api/auth/send-code')
      .send({ phone })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone, verificationCode: '123456' })
      .expect(201);

    const accessToken = loginResponse.body.accessToken as string;
    const authHeader = {
      Authorization: `Bearer ${accessToken}`,
    };

    const childResponse = await request(app.getHttpServer())
      .post('/api/children')
      .set(authHeader)
      .send({
        name: 'CharacterSessionTester',
        gender: 'MALE',
        grade: 3,
      })
      .expect(201);

    const childId = childResponse.body.id as string;

    const editionListResponse = await request(app.getHttpServer())
      .get('/api/textbooks/editions')
      .query({ subjectCode: 'CHINESE' })
      .expect(200);

    const seededEdition = editionListResponse.body.find(
      (item: { code: string }) => item.code === 'CHINESE_RJB_2024',
    );
    expect(seededEdition).toBeDefined();

    const volumesResponse = await request(app.getHttpServer())
      .get(`/api/textbooks/editions/${seededEdition.id}/volumes`)
      .query({ publishedOnly: true, grade: 3, semester: 'FIRST_TERM' })
      .expect(200);

    const seededVolumeId = volumesResponse.body[0].id as string;

    const treeResponse = await request(app.getHttpServer())
      .get(`/api/textbooks/volumes/${seededVolumeId}/tree`)
      .expect(200);

    const characterLessonNodeId = treeResponse.body.nodes[0].children[0].children[1]
      .id as string;

    await request(app.getHttpServer())
      .post(`/api/children/${childId}/subjects/bindings`)
      .set(authHeader)
      .send({
        subjectCode: 'CHINESE',
        editionId: seededEdition.id,
        volumeId: seededVolumeId,
        grade: 3,
        semester: 'FIRST_TERM',
        currentNodeId: characterLessonNodeId,
        metadata: {
          source: 'character_session_e2e',
        },
      })
      .expect(201);

    const pendingPushesResponse = await request(app.getHttpServer())
      .get('/api/pushes/pending')
      .query({ childId })
      .set(authHeader)
      .expect(200);

    expect(pendingPushesResponse.body).toHaveLength(1);
    const push = pendingPushesResponse.body[0];

    await request(app.getHttpServer())
      .post(`/api/pushes/${push.id}/approve`)
      .set(authHeader)
      .send({ action: 'APPROVE' })
      .expect(201);

    const persistedTask = await prismaService.learningTask.findFirstOrThrow({
      where: {
        pushId: push.id,
      },
    });

    await request(app.getHttpServer())
      .post(`/api/pushes/${push.id}/deliver`)
      .set(authHeader)
      .expect(201);

    const sessionResponse = await request(app.getHttpServer())
      .post('/api/learning/sessions')
      .set(authHeader)
      .send({ taskId: persistedTask.id })
      .expect(201);

    expect(sessionResponse.body.items.length).toBeGreaterThanOrEqual(2);
    expect(
      sessionResponse.body.items.some(
        (item: { prompt: { questionType?: string } }) =>
          item.prompt.questionType === 'character_radical',
      ),
    ).toBe(true);
    expect(
      sessionResponse.body.items.some(
        (item: { prompt: { questionType?: string } }) =>
          item.prompt.questionType === 'character_structure',
      ),
    ).toBe(true);

    const sessionId = sessionResponse.body.id as string;
    const persistedSessionItems = await prismaService.learningSessionItem.findMany({
      where: {
        sessionId,
      },
      orderBy: {
        sequence: 'asc',
      },
    });

    for (const persistedItem of persistedSessionItems) {
      const correctAnswer = persistedItem.correctAnswerJson as Record<string, unknown>;
      const prompt = persistedItem.promptJson as Record<string, unknown>;
      const answer =
        prompt.answerMode === 'multiple_choice'
          ? {
              selected: correctAnswer.selected,
            }
          : {
              completed: true,
            };

      await request(app.getHttpServer())
        .post(`/api/learning/sessions/${sessionId}/answer`)
        .set(authHeader)
        .send({
          sessionItemId: persistedItem.id,
          answer,
        })
        .expect(201);
    }

    const finishResponse = await request(app.getHttpServer())
      .post(`/api/learning/sessions/${sessionId}/finish`)
      .set(authHeader)
      .expect(201);

    expect(finishResponse.body.status).toBe('COMPLETED');
    expect(finishResponse.body.summary.correctItems).toBe(sessionResponse.body.items.length);
  });
});
