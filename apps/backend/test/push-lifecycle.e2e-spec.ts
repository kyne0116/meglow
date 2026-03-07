import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("Push Lifecycle (e2e)", () => {
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

  it("should support postponed requeue and expiration", async () => {
    const phone = `13${String(Date.now()).slice(-9)}`;
    const loginRes = await request(app.getHttpServer()).post("/api/auth/login").send({
      phone,
      verificationCode: "123456"
    });
    expect(loginRes.statusCode).toBe(201);
    token = loginRes.body.accessToken as string;

    const childRes = await request(app.getHttpServer())
      .post("/api/children")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Amy",
        gender: "FEMALE",
        birthDate: "2015-05-01",
        grade: 5
      });
    expect(childRes.statusCode).toBe(201);
    childId = childRes.body.id as string;

    const createRes = await request(app.getHttpServer())
      .post("/api/pushes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        childId,
        summary: "Review words",
        reason: "manual test",
        expectedOutcome: "retain words",
        content: { mode: "word_review", words: ["apple"] },
        scheduledAt: new Date().toISOString()
      });
    expect(createRes.statusCode).toBe(201);
    const pushId = createRes.body.pushId as string;

    const postponeRes = await request(app.getHttpServer())
      .post(`/api/pushes/${pushId}/approve`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        action: "POSTPONE",
        postponedUntil: new Date(Date.now() - 1000).toISOString()
      });
    expect(postponeRes.statusCode).toBe(201);
    expect(postponeRes.body.status).toBe("POSTPONED");

    const requeueRes = await request(app.getHttpServer())
      .post("/api/pushes/postponed/requeue/run")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(requeueRes.statusCode).toBe(201);
    expect(typeof requeueRes.body.requeued).toBe("number");

    const pendingRes = await request(app.getHttpServer())
      .get("/api/pushes/pending")
      .set("Authorization", `Bearer ${token}`);
    expect(pendingRes.statusCode).toBe(200);
    const pendingItem = pendingRes.body.find((item: { id: string }) => item.id === pushId);
    expect(pendingItem).toBeTruthy();
    expect(pendingItem.status).toBe("PENDING_APPROVAL");
    expect(typeof pendingItem.content).toBe("object");
    expect(pendingItem.content.mode).toBe("word_review");

    const approveRes = await request(app.getHttpServer())
      .post(`/api/pushes/${pushId}/approve`)
      .set("Authorization", `Bearer ${token}`)
      .send({ action: "APPROVE" });
    expect(approveRes.statusCode).toBe(201);
    expect(approveRes.body.status).toBe("APPROVED");

    await prisma.learningPush.update({
      where: { id: pushId },
      data: { scheduledAt: new Date(Date.now() - 72 * 60 * 60 * 1000) }
    });

    const expireRes = await request(app.getHttpServer())
      .post("/api/pushes/expiration/run")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(expireRes.statusCode).toBe(201);
    expect(typeof expireRes.body.expired).toBe("number");

    const historyRes = await request(app.getHttpServer())
      .get(`/api/pushes/history/${childId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(historyRes.statusCode).toBe(200);
    const expiredItem = historyRes.body.find((item: { id: string }) => item.id === pushId);
    expect(expiredItem).toBeTruthy();
    expect(expiredItem.status).toBe("EXPIRED");
  });
});
