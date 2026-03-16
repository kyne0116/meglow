import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'object' && payload !== null) {
        if (this.isApiErrorPayload(payload)) {
          response.status(status).json(payload);
          return;
        }

        response.status(status).json({
          code: this.codeFromStatus(status),
          message: this.messageFromPayload(payload, exception.message),
          details: {
            path: request.url,
          },
        });
        return;
      }

      response.status(status).json({
        code: this.codeFromStatus(status),
        message: String(payload),
        details: {
          path: request.url,
        },
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_ERROR',
      message: 'unexpected server error',
      details: {
        path: request.url,
      },
    });
  }

  private codeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'VALIDATION_ERROR';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';
      default:
        return 'HTTP_ERROR';
    }
  }

  private isApiErrorPayload(
    payload: object,
  ): payload is { code: string; message: string; details: unknown } {
    return (
      'code' in payload &&
      'message' in payload &&
      'details' in payload
    );
  }

  private messageFromPayload(payload: object, fallback: string): string {
    const value =
      'message' in payload ? (payload as { message?: unknown }).message : undefined;

    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'string' && value.trim()) {
      return value;
    }

    return fallback;
  }
}
