import { Injectable, NestMiddleware } from "@nestjs/common";
import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";

export interface RequestWithId extends Request {
  requestId?: string;
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction): void {
    const incoming = req.header("x-request-id");
    const requestId = incoming && incoming.trim() ? incoming : randomUUID();
    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    next();
  }
}
