import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("Approval + Learning Flow (e2e)", () => {
  let app: INestApplication;
  const prisma = new PrismaClient();
  let token = "";
  let childId = "";

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

  it("should complete approval-learning-briefing-notification chain", async () => {
    const phone = `13${String(Date.now()).slice(-9)}`;
    const loginRes = await request(app.getHttpServer()).post("/api/auth/login").send({
      phone,
      verificationCode: "123456"
    });
    expect(loginRes.statusCode).toBe(201);
    token = loginRes.body.accessToken as string;
    expect(token).toBeTruthy();

    const createChildRes = await request(app.getHttpServer())
      .post("/api/children")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Tom",
        gender: "MALE",
        birthDate: "2016-01-01",
        grade: 4
      });
    expect(createChildRes.statusCode).toBe(201);
    childId = createChildRes.body.id as string;
    expect(childId).toBeTruthy();

    const startRes = await request(app.getHttpServer())
      .post("/api/english/word-learning/session/start")
      .set("Authorization", `Bearer ${token}`)
      .send({
        childId,
        words: ["cat", "dog"]
      });
    expect(startRes.statusCode).toBe(201);
    const sessionId = startRes.body.sessionId as string;
    expect(sessionId).toBeTruthy();

    const answerRes = await request(app.getHttpServer())
      .post(`/api/english/word-learning/session/${sessionId}/answer`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        word: "cat",
        answer: "cat",
        correct: true
      });
    expect(answerRes.statusCode).toBe(201);

    const endRes = await request(app.getHttpServer())
      .post(`/api/english/word-learning/session/${sessionId}/end`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(endRes.statusCode).toBe(201);
    expect(endRes.body.briefingId).toBeTruthy();
    expect(typeof endRes.body.points).toBe("number");

    const briefingsRes = await request(app.getHttpServer())
      .get(`/api/briefings/${childId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(briefingsRes.statusCode).toBe(200);
    expect(Array.isArray(briefingsRes.body)).toBe(true);
    expect(briefingsRes.body.length).toBeGreaterThan(0);

    await prisma.wordProgress.updateMany({
      where: { childId },
      data: { nextReviewAt: new Date(Date.now() - 60 * 1000) }
    });

    const schedulerRes = await request(app.getHttpServer())
      .post("/api/pushes/scheduler/run")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(schedulerRes.statusCode).toBe(201);
    expect(typeof schedulerRes.body.created).toBe("number");

    const pendingRes = await request(app.getHttpServer())
      .get("/api/pushes/pending")
      .set("Authorization", `Bearer ${token}`);
    expect(pendingRes.statusCode).toBe(200);
    expect(Array.isArray(pendingRes.body)).toBe(true);
    expect(pendingRes.body.length).toBeGreaterThan(0);

    const pushId = pendingRes.body[0].id as string;
    const approveRes = await request(app.getHttpServer())
      .post(`/api/pushes/${pushId}/approve`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        action: "APPROVE"
      });
    expect(approveRes.statusCode).toBe(201);
    expect(approveRes.body.status).toBe("APPROVED");

    const tasksRes = await request(app.getHttpServer())
      .get(`/api/pushes/tasks/${childId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(tasksRes.statusCode).toBe(200);
    expect(Array.isArray(tasksRes.body)).toBe(true);
    expect(tasksRes.body.length).toBeGreaterThan(0);

    const runDeliveryRes = await request(app.getHttpServer())
      .post("/api/pushes/delivery/run")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(runDeliveryRes.statusCode).toBe(201);
    expect(typeof runDeliveryRes.body.delivered).toBe("number");

    const deliveredTasksRes = await request(app.getHttpServer())
      .get(`/api/pushes/tasks/${childId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(deliveredTasksRes.statusCode).toBe(200);
    expect(Array.isArray(deliveredTasksRes.body)).toBe(true);
    expect(deliveredTasksRes.body.length).toBeGreaterThan(0);
    const deliveredTask = deliveredTasksRes.body.find((item: { id: string }) => item.id === pushId);
    expect(deliveredTask).toBeTruthy();
    expect(deliveredTask.status).toBe("DELIVERED");

    const completeRes = await request(app.getHttpServer())
      .post(`/api/pushes/${pushId}/complete`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(completeRes.statusCode).toBe(201);
    expect(completeRes.body.status).toBe("COMPLETED");

    const notificationsRes = await request(app.getHttpServer())
      .get("/api/notifications/me")
      .set("Authorization", `Bearer ${token}`);
    expect(notificationsRes.statusCode).toBe(200);
    expect(Array.isArray(notificationsRes.body)).toBe(true);
    expect(notificationsRes.body.length).toBeGreaterThan(0);
  });
});
