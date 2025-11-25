import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { KeycloakAuthService } from '../../modules/identity/application/services/keycloak-auth.service';

/**
 * View User Middleware
 *
 * Extracts user information from session token and attaches it to request
 * for use in Handlebars views. This allows templates to check authentication
 * status and conditionally render content.
 *
 * Also handles automatic token refresh when access token expires or is about to expire.
 */
@Injectable()
export class ViewUserMiddleware implements NestMiddleware {
    private readonly logger = new Logger(ViewUserMiddleware.name);

    constructor(private readonly keycloakAuthService: KeycloakAuthService) { }

    async use(req: Request, res: Response, next: NextFunction) {
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

                    // Check if token is expired or about to expire (within 60 seconds)
                    const currentTime = Math.floor(Date.now() / 1000);
                    const exp = payload.exp; // Expiration time in seconds
                    const expiresIn = exp ? exp - currentTime : 0;
                    const shouldRefresh = expiresIn < 60; // Refresh if expires in less than 60 seconds

                    if (shouldRefresh) {
                        // Token is expired or about to expire - try to refresh
                        this.logger.debug(`Token ${exp && exp < currentTime ? 'expired' : 'expiring soon'} (${expiresIn}s), attempting refresh`);

                        if (req.session?.refreshToken) {
                            try {
                                // Attempt to refresh the token
                                const tokens = await this.keycloakAuthService.refreshToken(req.session.refreshToken);

                                // Update session with new tokens
                                req.session.accessToken = tokens.access_token;
                                if (tokens.refresh_token) {
                                    req.session.refreshToken = tokens.refresh_token;
                                }
                                if (tokens.id_token) {
                                    req.session.idToken = tokens.id_token;
                                }

                                this.logger.debug('Token refreshed successfully');

                                // Decode the new access token to get user info
                                const newTokenParts = tokens.access_token.split('.');
                                if (newTokenParts.length === 3) {
                                    const newPayload = JSON.parse(
                                        Buffer.from(newTokenParts[1], 'base64url').toString('utf-8')
                                    );

                                    if (newPayload && newPayload.sub) {
                                        // Attach user info from refreshed token
                                        req['viewUser'] = {
                                            id: newPayload.sub,
                                            email: newPayload.email || '',
                                            username: newPayload.preferred_username || newPayload.email || 'user',
                                            name: newPayload.name || newPayload.preferred_username || newPayload.email || 'User',
                                            roles: newPayload.realm_access?.roles || [],
                                            isAuthenticated: true,
                                        };

                                        res.locals.user = req['viewUser'];
                                        res.locals.isAuthenticated = true;

                                        req.user = {
                                            userId: req['viewUser'].id,
                                            sub: req['viewUser'].id,
                                            id: req['viewUser'].id,
                                            email: req['viewUser'].email,
                                            username: req['viewUser'].username,
                                            name: req['viewUser'].name,
                                            roles: req['viewUser'].roles,
                                        };

                                        return next();
                                    }
                                }
                            } catch (refreshError) {
                                // Refresh failed - clear session and require re-login
                                this.logger.warn('Token refresh failed, clearing session', refreshError);
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
                        } else {
                            // No refresh token available - clear session
                            this.logger.debug('No refresh token available, clearing session');
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
