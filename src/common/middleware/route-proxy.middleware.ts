import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

/**
 * Route Proxy Middleware
 *
 * Handles proxying routes that need to be forwarded to NestJS controllers with /api prefix.
 * This replaces manual route proxying in main.ts with a proper NestJS middleware solution.
 */
@Injectable()
export class RouteProxyMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void {
        // Store original URL
        const originalUrl = req.url;

        // Define route mappings
        const routeMappings: Record<string, { target: string; queryTransform?: (params: URLSearchParams) => void }> = {
            '/products/:id': {
                target: '/api/products/:id'
            },
            '/categories/:id': {
                target: '/api/categories/:id'
            },
            '/login': {
                target: '/api/auth/login',
                queryTransform: (params) => params.set('format', 'html')
            },
            '/logout': {
                target: '/api/auth/logout'
            }
        };

        // Check if current path matches any route
        for (const [pattern, config] of Object.entries(routeMappings)) {
            const regex = new RegExp('^' + pattern.replace(/:id/g, '([^/]+)') + '$');
            const match = originalUrl.match(regex);

            if (match) {
                let newUrl = config.target;

                // Replace path parameters
                if (pattern.includes(':id') && match[1]) {
                    newUrl = newUrl.replace(':id', match[1]);
                }

                // Apply query string transformations
                if (req.url.includes('?')) {
                    const queryString = req.url.split('?')[1];
                    const params = new URLSearchParams(queryString);
                    config.queryTransform?.(params);
                    const newQueryString = params.toString();
                    newUrl += newQueryString ? '?' + newQueryString : '';
                }

                // Rewrite the request URL to forward to NestJS controller
                req.url = newUrl;
                req.originalUrl = newUrl;

                break;
            }
        }

        next();
    }
}
