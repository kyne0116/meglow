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
      "AdminAuditLog",
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

  it('supports admin login and current profile lookup', async () => {
    const suffix = `${Date.now()}`;
    const loginResponse = await request(app.getHttpServer())
      .post('/api/admin-auth/login')
      .send({
        username: 'admin',
        password: 'Admin@123456',
      })
      .expect(201);

    expect(loginResponse.body.username).toBe('admin');
    expect(loginResponse.body.role).toBe('SUPER_ADMIN');
    expect(loginResponse.body.accessToken).toBeTruthy();

    const meResponse = await request(app.getHttpServer())
      .get('/api/admin-auth/me')
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .expect(200);

    expect(meResponse.body.username).toBe('admin');
    expect(meResponse.body.role).toBe('SUPER_ADMIN');

    const overviewResponse = await request(app.getHttpServer())
      .get('/api/admin-overview')
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .expect(200);

    expect(overviewResponse.body.metrics).toBeTruthy();
    expect(overviewResponse.body.metrics.reviewStatusCounts).toEqual({
      DRAFT: expect.any(Number),
      REVIEWING: expect.any(Number),
      APPROVED: expect.any(Number),
      REJECTED: expect.any(Number),
      PUBLISHED: expect.any(Number),
      OFFLINE: expect.any(Number),
    });
    expect(overviewResponse.body.versionTrendSummary).toEqual({
      last7Days: {
        totalChanges: expect.any(Number),
        publishes: expect.any(Number),
      },
      previous7Days: {
        totalChanges: expect.any(Number),
        publishes: expect.any(Number),
      },
      delta: {
        totalChanges: expect.any(Number),
        publishes: expect.any(Number),
      },
    });
    expect(overviewResponse.body.assetSummary).toEqual({
      bySubject: expect.any(Array),
      byItemType: expect.any(Array),
    });
    expect(overviewResponse.body.platformConfigSummary).toEqual({
      learningDefaults: {
        autoApprove: false,
        dailyDurationMin: 20,
        wordsPerSession: 10,
      },
      verificationCode: {
        expiresInSec: 60,
      },
      accessToken: {
        expiresIn: expect.any(String),
      },
    });
    expect(Array.isArray(overviewResponse.body.recentAuditLogs)).toBe(true);
    expect(Array.isArray(overviewResponse.body.recentContentVersions)).toBe(true);

    const initialOverviewMetrics = overviewResponse.body.metrics as {
      publishedContentVersionCount: number;
      reviewStatusCounts: Record<string, number>;
    };
    const initialVersionTrendSummary = overviewResponse.body.versionTrendSummary as {
      last7Days: {
        totalChanges: number;
        publishes: number;
      };
      previous7Days: {
        totalChanges: number;
        publishes: number;
      };
      delta: {
        totalChanges: number;
        publishes: number;
      };
    };
    const initialAssetSummary = overviewResponse.body.assetSummary as {
      bySubject: Array<{
        subjectCode: string;
        contentItemCount: number;
        publishedVersionCount: number;
      }>;
      byItemType: Array<{
        itemType: string;
        contentItemCount: number;
      }>;
    };

    const adminUsersResponse = await request(app.getHttpServer())
      .get('/api/admin-users')
      .query({
        limit: 10,
      })
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .expect(200);

    expect(Array.isArray(adminUsersResponse.body)).toBe(true);

    const createdAdminUserResponse = await request(app.getHttpServer())
      .post('/api/admin-users')
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .send({
        username: `editor_${suffix}`,
        displayName: `编辑员 ${suffix}`,
        password: 'Editor@123456',
        role: 'CONTENT_EDITOR',
      })
      .expect(201);

    expect(createdAdminUserResponse.body.username).toBe(`editor_${suffix}`);
    expect(createdAdminUserResponse.body.role).toBe('CONTENT_EDITOR');

    const updatedAdminUserResponse = await request(app.getHttpServer())
      .patch(`/api/admin-users/${createdAdminUserResponse.body.id}`)
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .send({
        displayName: `发布员 ${suffix}`,
        role: 'CONTENT_PUBLISHER',
        isEnabled: false,
      })
      .expect(200);

    expect(updatedAdminUserResponse.body.displayName).toBe(`发布员 ${suffix}`);
    expect(updatedAdminUserResponse.body.role).toBe('CONTENT_PUBLISHER');
    expect(updatedAdminUserResponse.body.isEnabled).toBe(false);

    await request(app.getHttpServer())
      .post('/api/admin-auth/login')
      .send({
        username: `editor_${suffix}`,
        password: 'Editor@123456',
      })
      .expect(403);

    const contentItemsResponse = await request(app.getHttpServer())
      .get('/api/admin-content/content-items')
      .query({
        limit: 5,
      })
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .expect(200);

    expect(Array.isArray(contentItemsResponse.body)).toBe(true);

    const createdContentItemResponse = await request(app.getHttpServer())
      .post('/api/admin-content-ops/content-items')
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .send({
        subjectCode: 'ENGLISH',
        itemType: 'TEXT',
        canonicalKey: `admin-e2e-${suffix}`,
        title: `Admin E2E Content ${suffix}`,
        summary: 'created by admin e2e',
        difficultyLevel: 2,
        k12Stage: 'JUNIOR_HIGH',
        isReusable: true,
      })
      .expect(201);

    const contentItemId = createdContentItemResponse.body.id as string;

    const createdVersionResponse = await request(app.getHttpServer())
      .post(`/api/admin-content-ops/content-items/${contentItemId}/versions`)
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .send({
        title: `Admin E2E Content ${suffix} v1`,
        payload: {
          blocks: [
            {
              type: 'paragraph',
              text: 'admin content ops write path',
            },
          ],
        },
        changeSummary: 'admin init',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/admin-content-ops/content-items/${contentItemId}/publish`)
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .send({
        versionId: createdVersionResponse.body.id,
      })
      .expect(201);

    const createdDraftVersionResponse = await request(app.getHttpServer())
      .post(`/api/admin-content-ops/content-items/${contentItemId}/versions`)
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .send({
        title: `Admin E2E Content ${suffix} v2`,
        payload: {
          blocks: [
            {
              type: 'paragraph',
              text: 'admin content ops draft follow-up',
            },
          ],
        },
        changeSummary: 'admin draft update',
      })
      .expect(201);

    const createdPublishedVersionResponse = await request(app.getHttpServer())
      .post(`/api/admin-content-ops/content-items/${contentItemId}/versions`)
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .send({
        title: `Admin E2E Content ${suffix} v3`,
        payload: {
          blocks: [
            {
              type: 'paragraph',
              text: 'admin content ops publish follow-up',
            },
          ],
        },
        changeSummary: 'admin publish update',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/admin-content-ops/content-items/${contentItemId}/publish`)
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .send({
        versionId: createdPublishedVersionResponse.body.id,
      })
      .expect(201);

    const now = new Date();
    const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    await prismaService.contentItemVersion.update({
      where: {
        id: createdVersionResponse.body.id as string,
      },
      data: {
        createdAt: daysAgo(10),
        updatedAt: daysAgo(9),
        publishedAt: daysAgo(9),
      },
    });

    await prismaService.contentItemVersion.update({
      where: {
        id: createdDraftVersionResponse.body.id as string,
      },
      data: {
        createdAt: daysAgo(2),
        updatedAt: now,
      },
    });

    await prismaService.contentItemVersion.update({
      where: {
        id: createdPublishedVersionResponse.body.id as string,
      },
      data: {
        createdAt: daysAgo(1),
        updatedAt: now,
        publishedAt: daysAgo(1),
      },
    });

    const updatedOverviewResponse = await request(app.getHttpServer())
      .get('/api/admin-overview')
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .expect(200);

    expect(updatedOverviewResponse.body.metrics.publishedContentVersionCount).toBe(
      initialOverviewMetrics.publishedContentVersionCount + 1,
    );
    expect(updatedOverviewResponse.body.metrics.reviewStatusCounts.DRAFT).toBe(
      initialOverviewMetrics.reviewStatusCounts.DRAFT + 1,
    );
    expect(updatedOverviewResponse.body.metrics.reviewStatusCounts.PUBLISHED).toBe(
      initialOverviewMetrics.reviewStatusCounts.PUBLISHED + 1,
    );
    expect(updatedOverviewResponse.body.versionTrendSummary).toEqual({
      last7Days: {
        totalChanges: initialVersionTrendSummary.last7Days.totalChanges + 2,
        publishes: initialVersionTrendSummary.last7Days.publishes + 1,
      },
      previous7Days: {
        totalChanges: initialVersionTrendSummary.previous7Days.totalChanges + 1,
        publishes: initialVersionTrendSummary.previous7Days.publishes + 1,
      },
      delta: {
        totalChanges:
          initialVersionTrendSummary.last7Days.totalChanges -
          initialVersionTrendSummary.previous7Days.totalChanges +
          1,
        publishes:
          initialVersionTrendSummary.last7Days.publishes -
          initialVersionTrendSummary.previous7Days.publishes,
      },
    });
    expect(
      updatedOverviewResponse.body.assetSummary.bySubject.find(
        (item: {
          subjectCode: string;
          contentItemCount: number;
          publishedVersionCount: number;
        }) => item.subjectCode === 'ENGLISH',
      ),
    ).toEqual({
      subjectCode: 'ENGLISH',
      subjectName: expect.any(String),
      contentItemCount:
        (initialAssetSummary.bySubject.find((item) => item.subjectCode === 'ENGLISH')?.contentItemCount ?? 0) + 1,
      publishedVersionCount:
        (initialAssetSummary.bySubject.find((item) => item.subjectCode === 'ENGLISH')?.publishedVersionCount ?? 0) + 1,
    });
    expect(
      updatedOverviewResponse.body.assetSummary.byItemType.find(
        (item: { itemType: string; contentItemCount: number }) => item.itemType === 'TEXT',
      )?.contentItemCount,
    ).toBe(
      (initialAssetSummary.byItemType.find((item) => item.itemType === 'TEXT')?.contentItemCount ?? 0) + 1,
    );
    expect(
      updatedOverviewResponse.body.recentContentVersions.some(
        (item: {
          contentItemId: string;
          version: number;
          reviewStatus: string;
          changeSummary: string | null;
        }) =>
          item.contentItemId === contentItemId &&
          item.version === createdDraftVersionResponse.body.version &&
          item.reviewStatus === 'DRAFT' &&
          item.changeSummary === 'admin draft update',
      ),
    ).toBe(true);
    expect(
      updatedOverviewResponse.body.recentContentVersions.some(
        (item: {
          contentItemId: string;
          version: number;
          reviewStatus: string;
          publishedAt: string | null;
        }) =>
          item.contentItemId === contentItemId &&
          item.version === createdPublishedVersionResponse.body.version &&
          item.reviewStatus === 'PUBLISHED' &&
          typeof item.publishedAt === 'string',
      ),
    ).toBe(true);

    const editionResponse = await request(app.getHttpServer())
      .post('/api/admin-content-ops/textbooks/editions')
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .send({
        subjectCode: 'ENGLISH',
        publisherCode: 'RJB',
        code: `ADMIN_EDITION_${suffix}`,
        displayName: `Admin Edition ${suffix}`,
        curriculumYear: 2026,
        regionScope: '全国',
      })
      .expect(201);

    const volumeResponse = await request(app.getHttpServer())
      .post(`/api/admin-content-ops/textbooks/editions/${editionResponse.body.id}/volumes`)
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .send({
        grade: 7,
        semester: 'SECOND_TERM',
        volumeLabel: `Admin Volume ${suffix}`,
        k12Stage: 'JUNIOR_HIGH',
        sortOrder: 1,
        version: 1,
      })
      .expect(201);

    const rootNodeResponse = await request(app.getHttpServer())
      .post(`/api/admin-content-ops/textbooks/volumes/${volumeResponse.body.id}/nodes`)
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .send({
        nodeType: 'VOLUME',
        nodeCode: `ROOT_${suffix}`,
        title: `Root ${suffix}`,
        sortOrder: 1,
        isLeaf: false,
      })
      .expect(201);

    const lessonNodeResponse = await request(app.getHttpServer())
      .post(`/api/admin-content-ops/textbooks/volumes/${volumeResponse.body.id}/nodes`)
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .send({
        parentId: rootNodeResponse.body.id,
        nodeType: 'LESSON',
        nodeCode: `LESSON_${suffix}`,
        title: `Lesson ${suffix}`,
        sortOrder: 2,
        isLeaf: true,
      })
      .expect(201);

    const sectionNodeResponse = await request(app.getHttpServer())
      .post(`/api/admin-content-ops/textbooks/volumes/${volumeResponse.body.id}/nodes`)
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .send({
        parentId: lessonNodeResponse.body.id,
        nodeType: 'SECTION',
        nodeCode: `SECTION_${suffix}`,
        title: `Section ${suffix}`,
        sortOrder: 1,
        isLeaf: true,
      })
      .expect(201);

    const knowledgePointResponse = await request(app.getHttpServer())
      .post('/api/admin-content-ops/knowledge-points')
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .send({
        subjectCode: 'ENGLISH',
        code: `ADMIN_KP_${suffix}`,
        name: `Admin KP ${suffix}`,
        description: 'admin knowledge point',
        difficultyLevel: 2,
        k12Stage: 'JUNIOR_HIGH',
      })
      .expect(201);

    const updatedKnowledgePointResponse = await request(app.getHttpServer())
      .patch(`/api/admin-content-ops/knowledge-points/${knowledgePointResponse.body.id}`)
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .send({
        name: `Admin KP Updated ${suffix}`,
        description: 'admin knowledge point updated',
        difficultyLevel: 3,
        isEnabled: false,
        tags: {
          labels: ['grammar', 'unit-test'],
        },
      })
      .expect(200);

    expect(updatedKnowledgePointResponse.body.name).toBe(`Admin KP Updated ${suffix}`);
    expect(updatedKnowledgePointResponse.body.isEnabled).toBe(false);

    const disabledKnowledgePointsResponse = await request(app.getHttpServer())
      .get('/api/textbooks/knowledge-points')
      .query({
        subjectCode: 'ENGLISH',
        enabled: false,
      })
      .expect(200);

    expect(
      disabledKnowledgePointsResponse.body.some(
        (item: { id: string; name: string }) => item.id === knowledgePointResponse.body.id,
      ),
    ).toBe(true);
    expect(
      disabledKnowledgePointsResponse.body.find(
        (item: { id: string; tags: { labels?: string[] } | null }) => item.id === knowledgePointResponse.body.id,
      )?.tags?.labels,
    ).toEqual(['grammar', 'unit-test']);

    const enabledKnowledgePointsResponse = await request(app.getHttpServer())
      .get('/api/textbooks/knowledge-points')
      .query({
        subjectCode: 'ENGLISH',
        enabled: true,
      })
      .expect(200);

    expect(
      enabledKnowledgePointsResponse.body.some(
        (item: { id: string; name: string }) => item.id === knowledgePointResponse.body.id,
      ),
    ).toBe(false);

    await request(app.getHttpServer())
      .post(`/api/admin-content-ops/textbooks/nodes/${lessonNodeResponse.body.id}/content-items`)
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .send({
        contentItemId,
        isPrimary: true,
        sortOrder: 1,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/admin-content-ops/textbooks/nodes/${lessonNodeResponse.body.id}/knowledge-points`)
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .send({
        knowledgePointId: knowledgePointResponse.body.id,
        relationType: 'PRIMARY',
        sortOrder: 1,
      })
      .expect(201);

    const updatedNodeResponse = await request(app.getHttpServer())
      .patch(`/api/admin-content-ops/textbooks/nodes/${lessonNodeResponse.body.id}`)
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .send({
        parentId: null,
        title: `Lesson Updated ${suffix}`,
        description: 'updated by admin e2e',
        sortOrder: 3,
        isLeaf: true,
      })
      .expect(200);

    expect(updatedNodeResponse.body.title).toBe(`Lesson Updated ${suffix}`);
    expect(updatedNodeResponse.body.sortOrder).toBe(3);
    expect(updatedNodeResponse.body.depth).toBe(1);

    const nodeDetailResponse = await request(app.getHttpServer())
      .get(`/api/textbooks/nodes/${lessonNodeResponse.body.id}`)
      .expect(200);

    expect(nodeDetailResponse.body.title).toBe(`Lesson Updated ${suffix}`);
    expect(nodeDetailResponse.body.description).toBe('updated by admin e2e');
    expect(nodeDetailResponse.body.parentId).toBeNull();
    expect(nodeDetailResponse.body.depth).toBe(1);

    const sectionNodeDetailResponse = await request(app.getHttpServer())
      .get(`/api/textbooks/nodes/${sectionNodeResponse.body.id}`)
      .expect(200);

    expect(sectionNodeDetailResponse.body.parentId).toBe(lessonNodeResponse.body.id);
    expect(sectionNodeDetailResponse.body.depth).toBe(2);

    const nodeContentItemsResponse = await request(app.getHttpServer())
      .get(`/api/textbooks/nodes/${lessonNodeResponse.body.id}/content-items`)
      .query({
        includeDraft: true,
      })
      .expect(200);

    expect(nodeContentItemsResponse.body).toHaveLength(1);
    expect(nodeContentItemsResponse.body[0].id).toBe(contentItemId);

    const nodeKnowledgePointsResponse = await request(app.getHttpServer())
      .get(`/api/textbooks/nodes/${lessonNodeResponse.body.id}/knowledge-points`)
      .expect(200);

    expect(nodeKnowledgePointsResponse.body).toHaveLength(1);
    expect(nodeKnowledgePointsResponse.body[0].id).toBe(knowledgePointResponse.body.id);

    await request(app.getHttpServer())
      .delete(
        `/api/admin-content-ops/textbooks/nodes/${lessonNodeResponse.body.id}/content-items/${contentItemId}`,
      )
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .expect(200);

    await request(app.getHttpServer())
      .delete(
        `/api/admin-content-ops/textbooks/nodes/${lessonNodeResponse.body.id}/knowledge-points/${knowledgePointResponse.body.id}`,
      )
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/textbooks/nodes/${lessonNodeResponse.body.id}/content-items`)
      .query({
        includeDraft: true,
      })
      .expect(200)
      .expect([]);

    await request(app.getHttpServer())
      .get(`/api/textbooks/nodes/${lessonNodeResponse.body.id}/knowledge-points`)
      .expect(200)
      .expect([]);

    await request(app.getHttpServer())
      .delete(`/api/admin-content-ops/textbooks/nodes/${lessonNodeResponse.body.id}`)
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/textbooks/nodes/${lessonNodeResponse.body.id}`)
      .expect(404);

    const auditLogsResponse = await request(app.getHttpServer())
      .get('/api/admin-audit/logs')
      .query({
        limit: 20,
      })
      .set({
        Authorization: `Bearer ${loginResponse.body.accessToken as string}`,
      })
      .expect(200);

    expect(auditLogsResponse.body.length).toBeGreaterThan(0);
    expect(
      auditLogsResponse.body.some(
        (item: { action: string; targetType: string }) =>
          item.action === 'TEXTBOOK_NODE_DELETED' && item.targetType === 'TEXTBOOK_NODE',
      ),
    ).toBe(true);
    expect(
      auditLogsResponse.body.some(
        (item: { action: string; targetType: string }) =>
          item.action === 'ADMIN_USER_UPDATED' && item.targetType === 'ADMIN_USER',
      ),
    ).toBe(true);
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

    expect(sessionResponse.body.items).toHaveLength(9);
    const sessionId = sessionResponse.body.id as string;

    const sessionDetailResponse = await request(app.getHttpServer())
      .get(`/api/learning/sessions/${sessionId}`)
      .set(authHeader)
      .expect(200);

    for (const item of sessionDetailResponse.body.items as Array<{
      id: string;
      itemType: 'WORD_MEANING' | 'WORD_SPELLING' | 'WORD_PRONUNCIATION';
      prompt: { word?: string; meaningZh?: string };
    }>) {
      const answer =
        item.itemType === 'WORD_MEANING'
          ? { selected: wordMap.get(item.prompt.word ?? '') }
          : item.itemType === 'WORD_SPELLING'
            ? {
              text: Array.from(wordMap.entries()).find(
                ([, meaningZh]) => meaningZh === item.prompt.meaningZh,
              )?.[0],
            }
            : {
              completed: true,
              selfRating: 'GOOD',
            };

      const answerResponse = await request(app.getHttpServer())
        .post(`/api/learning/sessions/${sessionId}/answer`)
        .set(authHeader)
        .send({
          sessionItemId: item.id,
          answer,
        })
        .expect(201);

      if (item.itemType === 'WORD_PRONUNCIATION') {
        expect(answerResponse.body.isCorrect).toBe(true);
        expect(answerResponse.body.score).toBe(100);
        expect(answerResponse.body.feedback).toBe(
          'pronunciation felt smooth and clear',
        );
      }

      expect(answerResponse.body.isCorrect).toBe(true);
    }

    const finishResponse = await request(app.getHttpServer())
      .post(`/api/learning/sessions/${sessionId}/finish`)
      .set(authHeader)
      .expect(201);

    expect(finishResponse.body.status).toBe('COMPLETED');
    expect(finishResponse.body.summary.totalItems).toBe(9);
    expect(finishResponse.body.summary.correctItems).toBe(9);
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
