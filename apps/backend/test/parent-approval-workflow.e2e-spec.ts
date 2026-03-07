import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ParentApprovalWorkflowRunStatus, PrismaClient } from "@prisma/client";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { ParentApprovalWorkflowService } from "../src/ai/workflows/parent-approval-workflow.service";

describe("Parent Approval Workflow (e2e)", () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it("should start suspended workflow and resume to approve push", async () => {
    const phone = `13${String(Date.now()).slice(-9)}`;
    const loginRes = await request(app.getHttpServer()).post("/api/auth/login").send({
      phone,
      verificationCode: "123456"
    });
    expect(loginRes.statusCode).toBe(201);
    const token = loginRes.body.accessToken as string;
    expect(token).toBeTruthy();

    const createChildRes = await request(app.getHttpServer())
      .post("/api/children")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "WorkflowKid",
        gender: "MALE",
        birthDate: "2016-03-07",
        grade: 4
      });
    expect(createChildRes.statusCode).toBe(201);
    const childId = createChildRes.body.id as string;
    expect(childId).toBeTruthy();

    const createPushRes = await request(app.getHttpServer())
      .post("/api/pushes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        childId,
        summary: "Workflow approval test push",
        reason: "mastra workflow e2e",
        expectedOutcome: "pending push should be approved via workflow resume",
        content: { mode: "word_review", words: ["apple", "banana"] },
        scheduledAt: new Date().toISOString()
      });
    expect(createPushRes.statusCode).toBe(201);
    const pushId = createPushRes.body.pushId as string;
    expect(pushId).toBeTruthy();

    const startRes = await request(app.getHttpServer())
      .post(`/api/ai/workflows/approval/start/${pushId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(startRes.statusCode).toBe(201);
    expect(startRes.body.workflowStatus).toBe("suspended");
    expect(startRes.body.runId).toBeTruthy();
    expect(startRes.body.pushId).toBe(pushId);

    const runId = startRes.body.runId as string;
    const resumeRes = await request(app.getHttpServer())
      .post(`/api/ai/workflows/approval/resume/${runId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        action: "APPROVE",
        comment: "approve in workflow e2e"
      });
    expect(resumeRes.statusCode).toBe(201);
    expect(resumeRes.body.workflowStatus).toBe("success");
    expect(resumeRes.body.appliedPushStatus).toBe("APPROVED");
    expect(resumeRes.body.pushId).toBe(pushId);

    const historyRes = await request(app.getHttpServer())
      .get(`/api/pushes/history/${childId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(historyRes.statusCode).toBe(200);
    const approvedPush = historyRes.body.find((item: { id: string }) => item.id === pushId);
    expect(approvedPush).toBeTruthy();
    expect(approvedPush.status).toBe("APPROVED");

    const workflowRun = await prisma.parentApprovalWorkflowRun.findUnique({
      where: { runId }
    });
    expect(workflowRun).toBeTruthy();
    expect(workflowRun?.status).toBe(ParentApprovalWorkflowRunStatus.SUCCESS);
  });

  it("should resume successfully when in-memory run is unavailable", async () => {
    const phone = `13${String(Date.now() + 7).slice(-9)}`;
    const loginRes = await request(app.getHttpServer()).post("/api/auth/login").send({
      phone,
      verificationCode: "123456"
    });
    expect(loginRes.statusCode).toBe(201);
    const token = loginRes.body.accessToken as string;
    expect(token).toBeTruthy();

    const createChildRes = await request(app.getHttpServer())
      .post("/api/children")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "FallbackKid",
        gender: "FEMALE",
        birthDate: "2015-06-07",
        grade: 5
      });
    expect(createChildRes.statusCode).toBe(201);
    const childId = createChildRes.body.id as string;
    expect(childId).toBeTruthy();

    const createPushRes = await request(app.getHttpServer())
      .post("/api/pushes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        childId,
        summary: "Runtime lost fallback test push",
        reason: "mastra workflow fallback e2e",
        expectedOutcome: "should approve via persistent record even without runtime",
        content: { mode: "word_review", words: ["pear", "grape"] },
        scheduledAt: new Date().toISOString()
      });
    expect(createPushRes.statusCode).toBe(201);
    const pushId = createPushRes.body.pushId as string;

    const autoStartRes = await request(app.getHttpServer())
      .post("/api/ai/workflows/approval/auto-start/run")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(autoStartRes.statusCode).toBe(201);
    expect(typeof autoStartRes.body.started).toBe("number");
    expect(typeof autoStartRes.body.skipped).toBe("number");

    const workflowRun = await prisma.parentApprovalWorkflowRun.findUnique({
      where: { pushId }
    });
    expect(workflowRun).toBeTruthy();
    expect(workflowRun?.status).toBe(ParentApprovalWorkflowRunStatus.SUSPENDED);
    const runId = workflowRun!.runId;

    app.get(ParentApprovalWorkflowService).clearInMemoryRunStoreForTest();

    const resumeRes = await request(app.getHttpServer())
      .post(`/api/ai/workflows/approval/resume/${runId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        action: "APPROVE",
        comment: "approve after runtime loss"
      });
    expect(resumeRes.statusCode).toBe(201);
    expect(resumeRes.body.workflowStatus).toBe("success");
    expect(resumeRes.body.appliedPushStatus).toBe("APPROVED");

    const historyRes = await request(app.getHttpServer())
      .get(`/api/pushes/history/${childId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(historyRes.statusCode).toBe(200);
    const approvedPush = historyRes.body.find((item: { id: string }) => item.id === pushId);
    expect(approvedPush).toBeTruthy();
    expect(approvedPush.status).toBe("APPROVED");

    const workflowRunAfter = await prisma.parentApprovalWorkflowRun.findUnique({
      where: { runId }
    });
    expect(workflowRunAfter).toBeTruthy();
    expect(workflowRunAfter?.status).toBe(ParentApprovalWorkflowRunStatus.SUCCESS);

    expect(workflowRunAfter?.lastError).toBeNull();
  });
});
