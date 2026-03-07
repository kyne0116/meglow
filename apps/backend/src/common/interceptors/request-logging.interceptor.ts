import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { RequestWithId } from "../middleware/request-id.middleware";

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest<RequestWithId>();
    const method = request.method;
    const url = request.originalUrl ?? request.url;
    const requestId = request.requestId ?? "-";

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - now;
          this.logger.log(`[${requestId}] ${method} ${url} ${duration}ms`);
        },
        error: (err: unknown) => {
          const duration = Date.now() - now;
          this.logger.error(`[${requestId}] ${method} ${url} ${duration}ms error=${String(err)}`);
        }
      })
    );
  }
}
