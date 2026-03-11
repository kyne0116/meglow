import { BadRequestException, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { ApiExceptionFilter } from '../src/common/filters/api-exception.filter';
import { PrismaService } from '../src/persistence/prisma/prisma.service';

jest.setTimeout(120000);

describe('Meglow business flow (e2e)', () => {
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

  beforeEach(async () => {
    await prismaService.$executeRawUnsafe(`
      TRUNCATE TABLE
      "PronunciationAttempt",
      "LearningSessionItem",
      "LearningSession",
      "LearningTask",
      "LearningPushActionLog",
      "LearningPush",
      "ChildWordProgress",
      "EnglishWord",
      "ChildLearningSettings",
      "ChildGameProfile",
      "ChildProfile",
      "Child",
      "FamilyInvite",
      "VerificationCode",
      "FamilyMembership",
      "Parent",
      "Family"
      CASCADE;
    `);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/health (GET)', async () => {
    await request(app.getHttpServer()).get('/api/health').expect(200);
  });

  it('completes login -> child -> push -> task -> learning session flow', async () => {
    const phone = `1${Date.now().toString().slice(-10)}`;
    const sendCodeResponse = await request(app.getHttpServer())
      .post('/api/auth/send-code')
      .send({ phone })
      .expect(201);

    expect(sendCodeResponse.body).toEqual({
      success: true,
      expiresInSec: 60,
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone, verificationCode: '123456' })
      .expect(201);

    const accessToken = loginResponse.body.accessToken as string;
    expect(accessToken).toBeTruthy();

    const authHeader = {
      Authorization: `Bearer ${accessToken}`,
    };

    const meResponse = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set(authHeader)
      .expect(200);

    expect(meResponse.body.phone).toBe(phone);
    expect(meResponse.body.role).toBe('OWNER');

    const childResponse = await request(app.getHttpServer())
      .post('/api/children')
      .set(authHeader)
      .send({
        name: 'Ming',
        gender: 'MALE',
        grade: 3,
      })
      .expect(201);

    const childId = childResponse.body.id as string;
    expect(childResponse.body.k12Stage).toBe('MIDDLE_PRIMARY');

    await request(app.getHttpServer())
      .put(`/api/children/${childId}/settings`)
      .set(authHeader)
      .send({
        autoApprove: false,
        wordsPerSession: 3,
        dailyDurationMin: 15,
      })
      .expect(200);

    const wordListResponse = await request(app.getHttpServer())
      .get('/api/content/english/words')
      .query({
        k12Stage: 'MIDDLE_PRIMARY',
        limit: 10,
      })
      .set(authHeader)
      .expect(200);

    expect(wordListResponse.body.length).toBeGreaterThan(0);
    const wordMap = new Map(
      wordListResponse.body.map((word: { value: string; meaningZh: string }) => [
        word.value,
        word.meaningZh,
      ]),
    );

    const pendingPushesResponse = await request(app.getHttpServer())
      .get('/api/pushes/pending')
      .query({ childId })
      .set(authHeader)
      .expect(200);

    expect(pendingPushesResponse.body).toHaveLength(1);
    const push = pendingPushesResponse.body[0];
    expect(push.content.words).toHaveLength(3);

    await request(app.getHttpServer())
      .post(`/api/pushes/${push.id}/approve`)
      .set(authHeader)
      .send({ action: 'APPROVE' })
      .expect(201);

    const approvedTasksResponse = await request(app.getHttpServer())
      .get(`/api/pushes/tasks/${childId}`)
      .set(authHeader)
      .expect(200);

    expect(approvedTasksResponse.body).toHaveLength(1);
    const task = approvedTasksResponse.body[0];
    expect(task.status).toBe('APPROVED');

    await request(app.getHttpServer())
      .post(`/api/pushes/${push.id}/deliver`)
      .set(authHeader)
      .expect(201);

    const sessionResponse = await request(app.getHttpServer())
      .post('/api/learning/sessions')
      .set(authHeader)
      .send({ taskId: task.id })
      .expect(201);

    expect(sessionResponse.body.items).toHaveLength(6);
    const sessionId = sessionResponse.body.id as string;

    const sessionDetailResponse = await request(app.getHttpServer())
      .get(`/api/learning/sessions/${sessionId}`)
      .set(authHeader)
      .expect(200);

    for (const item of sessionDetailResponse.body.items as Array<{
      id: string;
      itemType: 'WORD_MEANING' | 'WORD_SPELLING';
      prompt: { word?: string; meaningZh?: string };
    }>) {
      const answer =
        item.itemType === 'WORD_MEANING'
          ? { selected: wordMap.get(item.prompt.word ?? '') }
          : {
              text: Array.from(wordMap.entries()).find(
                ([, meaningZh]) => meaningZh === item.prompt.meaningZh,
              )?.[0],
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
    expect(finishResponse.body.summary.totalItems).toBe(6);
    expect(finishResponse.body.summary.correctItems).toBe(6);
    expect(finishResponse.body.summary.newWordsLearned).toBe(3);

    const completedTask = await prismaService.learningTask.findUnique({
      where: {
        id: task.id,
      },
    });
    expect(completedTask?.status).toBe('COMPLETED');

    const wordProgressCount = await prismaService.childWordProgress.count({
      where: {
        childId,
      },
    });
    expect(wordProgressCount).toBe(3);
  });
});
