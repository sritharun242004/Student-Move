import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  RpcExceptionFilter,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

@Catch()
export class HttpToRpcExceptionFilter implements RpcExceptionFilter<unknown> {
  catch(exception: unknown, _host: ArgumentsHost): Observable<never> {
    if (exception instanceof RpcException) {
      return throwError(() => exception);
    }

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const normalized =
        typeof response === 'string'
          ? { message: response }
          : (response as Record<string, unknown>);

      return throwError(() =>
        new RpcException({
          statusCode: exception.getStatus(),
          message: normalized.message ?? exception.message,
          error: normalized.error,
        }),
      );
    }

    if (exception instanceof Error) {
      return throwError(() =>
        new RpcException({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: exception.message,
        }),
      );
    }

    return throwError(() =>
      new RpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      }),
    );
  }
}
