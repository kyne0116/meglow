import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Request, Response } from "express";
import { RequestWithId } from "../middleware/request-id.middleware";

interface ErrorResponseBody {
  code: string;
  message: string;
  statusCode: number;
  path: string;
  requestId: string;
  timestamp: string;
  details?: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId & Request>();

    const requestId = request.requestId ?? "-";
    const path = request.originalUrl ?? request.url;
    const timestamp = new Date().toISOString();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const normalized = this.normalizeHttpExceptionPayload(payload);
      const body: ErrorResponseBody = {
        code: this.mapStatusToCode(status),
        message: normalized.message,
        statusCode: status,
        path,
        requestId,
        timestamp,
        details: normalized.details
      };
      response.status(status).json(body);
      return;
    }

    const body: ErrorResponseBody = {
      code: "INTERNAL_SERVER_ERROR",
      message: "internal server error",
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      path,
      requestId,
      timestamp
    };
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }

  private normalizeHttpExceptionPayload(payload: string | object): {
    message: string;
    details?: unknown;
  } {
    if (typeof payload === "string") {
      return { message: payload };
    }

    const maybeMessage = (payload as { message?: unknown }).message;
    if (Array.isArray(maybeMessage)) {
      return {
        message: maybeMessage.join("; "),
        details: payload
      };
    }

    if (typeof maybeMessage === "string") {
      return {
        message: maybeMessage,
        details: payload
      };
    }

    return {
      message: "request failed",
      details: payload
    };
  }

  private mapStatusToCode(status: number): string {
    if (status === HttpStatus.BAD_REQUEST) return "BAD_REQUEST";
    if (status === HttpStatus.UNAUTHORIZED) return "UNAUTHORIZED";
    if (status === HttpStatus.FORBIDDEN) return "FORBIDDEN";
    if (status === HttpStatus.NOT_FOUND) return "NOT_FOUND";
    if (status === HttpStatus.CONFLICT) return "CONFLICT";
    if (status >= 500) return "INTERNAL_SERVER_ERROR";
    return "REQUEST_FAILED";
  }
}
