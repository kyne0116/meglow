import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("Child Settings + Scheduler (e2e)", () => {
  let app: INestApplication;
  const prisma = new PrismaClient();
  let token = "";

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

  it("should apply settings to scheduler (auto-approve, words limit, and time window skip)", async () => {
    const phone = `13${String(Date.now()).slice(-9)}`;
    const loginRes = await request(app.getHttpServer()).post("/api/auth/login").send({
      phone,
      verificationCode: "123456"
    });
    expect(loginRes.statusCode).toBe(201);
    token = loginRes.body.accessToken as string;

    const child1Res = await request(app.getHttpServer())
      .post("/api/children")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Lily",
        gender: "FEMALE",
        birthDate: "2015-06-01",
        grade: 4
      });
    expect(child1Res.statusCode).toBe(201);
    const child1Id = child1Res.body.id as string;

    const updateSettingsRes = await request(app.getHttpServer())
      .put(`/api/children/${child1Id}/settings`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        autoApprove: true,
        wordsPerSession: 1,
        weekdayTimeWindows: [{ start: "00:00", end: "23:59" }],
        weekendTimeWindows: [{ start: "00:00", end: "23:59" }]
      });
    expect(updateSettingsRes.statusCode).toBe(200);
    expect(updateSettingsRes.body.autoApprove).toBe(true);
    expect(updateSettingsRes.body.wordsPerSession).toBe(1);

    const wordAValue = `apple_${Date.now()}_a`;
    const wordBValue = `banana_${Date.now()}_b`;
    const wordCValue = `cherry_${Date.now()}_c`;

    const wordA = await prisma.word.upsert({
      where: { value: wordAValue },
      update: {},
      create: { value: wordAValue, difficulty: 1 }
    });
    const wordB = await prisma.word.upsert({
      where: { value: wordBValue },
      update: {},
      create: { value: wordBValue, difficulty: 1 }
    });

    await prisma.wordProgress.upsert({
      where: {
        childId_wordId: {
          childId: child1Id,
          wordId: wordA.id
        }
      },
      update: {
        nextReviewAt: new Date(Date.now() - 60 * 1000),
        mastered: false
      },
      create: {
        childId: child1Id,
        wordId: wordA.id,
        nextReviewAt: new Date(Date.now() - 60 * 1000),
        mastered: false
      }
    });
    await prisma.wordProgress.upsert({
      where: {
        childId_wordId: {
          childId: child1Id,
          wordId: wordB.id
        }
      },
      update: {
        nextReviewAt: new Date(Date.now() - 60 * 1000),
        mastered: false
      },
      create: {
        childId: child1Id,
        wordId: wordB.id,
        nextReviewAt: new Date(Date.now() - 60 * 1000),
        mastered: false
      }
    });

    const schedulerRes = await request(app.getHttpServer())
      .post("/api/pushes/scheduler/run")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(schedulerRes.statusCode).toBe(201);
    expect(schedulerRes.body.created).toBeGreaterThanOrEqual(1);

    const pendingRes = await request(app.getHttpServer())
      .get("/api/pushes/pending")
      .set("Authorization", `Bearer ${token}`);
    expect(pendingRes.statusCode).toBe(200);
    expect(Array.isArray(pendingRes.body)).toBe(true);
    const child1Pending = pendingRes.body.find(
      (item: { childId: string }) => item.childId === child1Id
    );
    expect(child1Pending).toBeFalsy();

    const tasksRes = await request(app.getHttpServer())
      .get(`/api/pushes/tasks/${child1Id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(tasksRes.statusCode).toBe(200);
    expect(Array.isArray(tasksRes.body)).toBe(true);
    expect(tasksRes.body.length).toBeGreaterThan(0);
    const child1Task = tasksRes.body[0] as {
      id: string;
      status: string;
      content?: { words?: unknown[] };
    };
    expect(child1Task.status).toBe("APPROVED");
    expect(Array.isArray(child1Task.content?.words)).toBe(true);
    expect(child1Task.content?.words?.length).toBe(1);

    const deliveryRes = await request(app.getHttpServer())
      .post("/api/pushes/delivery/run")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(deliveryRes.statusCode).toBe(201);
    expect(typeof deliveryRes.body.delivered).toBe("number");

    const child1DeliveredRes = await request(app.getHttpServer())
      .get(`/api/pushes/tasks/${child1Id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(child1DeliveredRes.statusCode).toBe(200);
    const deliveredTask = child1DeliveredRes.body.find(
      (item: { id: string }) => item.id === child1Task.id
    );
    expect(deliveredTask).toBeTruthy();
    expect(deliveredTask.status).toBe("DELIVERED");

    const child2Res = await request(app.getHttpServer())
      .post("/api/children")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Noah",
        gender: "MALE",
        birthDate: "2015-08-01",
        grade: 4
      });
    expect(child2Res.statusCode).toBe(201);
    const child2Id = child2Res.body.id as string;

    const [outStart, outEnd] = buildOutOfWindow();
    const child2SettingsRes = await request(app.getHttpServer())
      .put(`/api/children/${child2Id}/settings`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        autoApprove: false,
        weekdayTimeWindows: [{ start: outStart, end: outEnd }],
        weekendTimeWindows: [{ start: outStart, end: outEnd }]
      });
    expect(child2SettingsRes.statusCode).toBe(200);

    const wordC = await prisma.word.upsert({
      where: { value: wordCValue },
      update: {},
      create: { value: wordCValue, difficulty: 1 }
    });

    await prisma.wordProgress.upsert({
      where: {
        childId_wordId: {
          childId: child2Id,
          wordId: wordC.id
        }
      },
      update: {
        nextReviewAt: new Date(Date.now() - 60 * 1000),
        mastered: false
      },
      create: {
        childId: child2Id,
        wordId: wordC.id,
        nextReviewAt: new Date(Date.now() - 60 * 1000),
        mastered: false
      }
    });

    const schedulerSkipRes = await request(app.getHttpServer())
      .post("/api/pushes/scheduler/run")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(schedulerSkipRes.statusCode).toBe(201);
    expect(schedulerSkipRes.body.created).toBe(0);

    const child2HistoryRes = await request(app.getHttpServer())
      .get(`/api/pushes/history/${child2Id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(child2HistoryRes.statusCode).toBe(200);
    expect(Array.isArray(child2HistoryRes.body)).toBe(true);
    expect(child2HistoryRes.body.length).toBe(0);
  });
});

function buildOutOfWindow(): [string, string] {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const start = (nowMinutes + 1) % (24 * 60);
  const end = (nowMinutes + 2) % (24 * 60);
  return [toTime(start), toTime(end)];
}

function toTime(minutesInDay: number): string {
  const hours = Math.floor(minutesInDay / 60);
  const minutes = minutesInDay % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
