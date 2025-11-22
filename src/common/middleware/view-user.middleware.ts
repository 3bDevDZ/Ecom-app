import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

/**
 * View User Middleware
 *
 * Extracts user information from session token and attaches it to request
 * for use in Handlebars views. This allows templates to check authentication
 * status and conditionally render content.
 */
@Injectable()
export class ViewUserMiddleware implements NestMiddleware {
    private readonly logger = new Logger(ViewUserMiddleware.name);

    use(req: Request, res: Response, next: NextFunction) {
        // Initialize user as null (unauthenticated)
        req['viewUser'] = null;
        res.locals.user = null;
        res.locals.isAuthenticated = false;

        // Check if session has access token
        if (req.session?.accessToken) {
            try {
                // Decode JWT token by splitting and parsing base64 payload
                // JWT format: header.payload.signature
                const tokenParts = req.session.accessToken.split('.');
                if (tokenParts.length === 3) {
                    // Decode payload (second part)
                    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64url').toString('utf-8'));

                    // Check if token is expired
                    const currentTime = Math.floor(Date.now() / 1000);
                    const exp = payload.exp; // Expiration time in seconds

                    if (exp && exp < currentTime) {
                        // Token is expired - clear session
                        this.logger.debug('Token expired, clearing session');
                        if (req.session) {
                            delete req.session.accessToken;
                            delete req.session.refreshToken;
                            delete req.session.idToken;
                        }
                        req['viewUser'] = null;
                        res.locals.user = null;
                        res.locals.isAuthenticated = false;
                        return next();
                    }

                    if (payload && payload.sub) {
                        // Attach user info to request for views
                        req['viewUser'] = {
                            id: payload.sub,
                            email: payload.email || '',
                            username: payload.preferred_username || payload.email || 'user',
                            name: payload.name || payload.preferred_username || payload.email || 'User',
                            roles: payload.realm_access?.roles || [],
                            isAuthenticated: true,
                        };

                        // Make viewUser available to all templates via res.locals
                        res.locals.user = req['viewUser'];
                        res.locals.isAuthenticated = true;

                        // Also attach to req.user for guards to use (session-based auth)
                        req.user = {
                            userId: req['viewUser'].id,
                            sub: req['viewUser'].id,
                            id: req['viewUser'].id,
                            email: req['viewUser'].email,
                            username: req['viewUser'].username,
                            name: req['viewUser'].name,
                            roles: req['viewUser'].roles,
                        };
                    }
                }
            } catch (error) {
                // Token might be invalid or malformed - clear session
                this.logger.debug('Invalid token in session, clearing');
                if (req.session) {
                    delete req.session.accessToken;
                    delete req.session.refreshToken;
                    delete req.session.idToken;
                }
                // User remains unauthenticated
                req['viewUser'] = null;
                res.locals.user = null;
                res.locals.isAuthenticated = false;
            }
        }

        next();
    }
}
