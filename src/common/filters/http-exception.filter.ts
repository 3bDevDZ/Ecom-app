import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global HTTP Exception Filter
 *
 * Handles all HTTP exceptions and formats consistent error responses
 * For 401 Unauthorized errors on HTML requests, redirects to /login
 * For API requests, returns JSON error responses
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Check if this is an HTML request (not an API request)
    const isHtmlRequest = this.isHtmlRequest(request);

    // For 401 Unauthorized errors on HTML requests, redirect to login
    if (status === HttpStatus.UNAUTHORIZED && isHtmlRequest) {
      this.logger.warn(
        `Unauthorized access attempt to ${request.method} ${request.url} - redirecting to login`,
      );

      // Store the original URL in session so we can redirect back after login
      if (request.session && request.url !== '/login') {
        request.session.returnTo = request.url;
      }

      return response.redirect('/login');
    }

    // For API requests or non-401 errors, return JSON response
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof message === 'string'
          ? message
          : (message as any).message || 'An error occurred',
    };

    // Log error for debugging
    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(status).json(errorResponse);
  }

  /**
   * Determine if the request is for HTML (view) or JSON (API)
   *
   * Checks:
   * 1. Accept header for text/html
   * 2. URL path starts with /api (API request)
   * 3. Query parameter format=json (explicit API request)
   */
  private isHtmlRequest(request: Request): boolean {
    // Explicit JSON format request
    if (request.query?.format === 'json') {
      return false;
    }

    // API routes always return JSON
    if (request.url.startsWith('/api/')) {
      return false;
    }

    // Check Accept header
    const acceptHeader = request.headers.accept || '';
    if (acceptHeader.includes('application/json')) {
      return false;
    }

    // Default to HTML for view routes
    return true;
  }
}

