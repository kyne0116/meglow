import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("AI Eval (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should return eval cases", async () => {
    const res = await request(app.getHttpServer()).get("/api/ai/evals/scenarios/cases");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should run scenario eval", async () => {
    const res = await request(app.getHttpServer()).post("/api/ai/evals/scenarios/run").send({});
    expect(res.statusCode).toBe(201);
    expect(typeof res.body.total).toBe("number");
    expect(typeof res.body.passRate).toBe("number");
    expect(Array.isArray(res.body.results)).toBe(true);
  });
});
