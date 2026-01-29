import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine status code
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Determine error message
    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            message: (exception as Error).message,
            error: 'Internal Server Error',
          };

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      // If message is an object (standard Nest error), spread it, else wrap it
      ...(typeof message === 'object' ? message : { message }),
    };

    // Log the error for debugging
    console.error(`[${request.method}] ${request.url} >> Error:`, exception);

    response.status(status).json(errorResponse);
  }
}
