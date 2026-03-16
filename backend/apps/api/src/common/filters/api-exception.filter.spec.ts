import {
  ArgumentsHost,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiExceptionFilter } from './api-exception.filter';

function createHttpHost(path = '/api/test') {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const request = { url: path };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as ArgumentsHost;

  return { host, request, response };
}

describe('ApiExceptionFilter', () => {
  test('normalizes default object payloads from HttpException into api error shape', () => {
    const filter = new ApiExceptionFilter();
    const { host, response } = createHttpHost('/api/content-items');

    filter.catch(new BadRequestException('invalid query'), host);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      code: 'VALIDATION_ERROR',
      message: 'invalid query',
      details: {
        path: '/api/content-items',
      },
    });
  });

  test('preserves already-normalized api exception payloads', () => {
    const filter = new ApiExceptionFilter();
    const { host, response } = createHttpHost();

    filter.catch(
      new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'missing bearer token',
        details: {},
      }),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      code: 'UNAUTHORIZED',
      message: 'missing bearer token',
      details: {},
    });
  });
});
