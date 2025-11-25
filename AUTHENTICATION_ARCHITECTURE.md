# Authentication Architecture Explanation

## Overview

This application uses **Keycloak** as an Identity Provider (IdP) with **OAuth 2.0 Authorization Code Flow with PKCE** for secure authentication. The system supports both:
- **Session-based authentication** (for HTML views/browser navigation)
- **Bearer token authentication** (for API calls)

---

## Architecture Components

### 1. **Keycloak Configuration** (`src/config/keycloak.config.ts`)

```typescript
{
  url: 'http://localhost:8080',
  realm: 'b2b-ecommerce',
  clientId: 'ecommerce-app',
  clientSecret: '', // Optional for public clients
  callbackUrl: 'http://localhost:3333/api/auth/callback'
}
```

**Purpose**: Centralized Keycloak settings loaded from environment variables.

---

### 2. **Authentication Flow**

#### **Step 1: User Initiates Login** (`/api/auth/login` or `/login`)

**File**: `src/modules/identity/presentation/controllers/auth.controller.ts`

**What happens**:
1. User clicks "Sign In" → navigates to `/login`
2. Controller checks if already authenticated (has session token)
3. If not authenticated:
   - Generates **PKCE code verifier** (random 32 bytes, base64url encoded)
   - Generates **PKCE code challenge** (SHA256 hash of verifier)
   - Generates **state parameter** (CSRF protection, 32 random bytes)
   - Stores `codeVerifier` and `state` in **session**
   - Redirects to Keycloak authorization URL

**PKCE (Proof Key for Code Exchange)**:
- Prevents authorization code interception attacks
- Code verifier is kept secret in session
- Code challenge is sent to Keycloak
- Later, verifier is sent to prove identity

#### **Step 2: Keycloak Authorization** (External)

**File**: `src/modules/identity/application/services/keycloak-auth.service.ts`

**What happens**:
1. User is redirected to Keycloak login page:
   ```
   http://localhost:8080/realms/b2b-ecommerce/protocol/openid-connect/auth?
     client_id=ecommerce-app
     &redirect_uri=http://localhost:3333/api/auth/callback
     &response_type=code
     &scope=openid profile email
     &state=<random-state>
     &code_challenge=<sha256-hash>
     &code_challenge_method=S256
   ```
2. User enters credentials on Keycloak page
3. Keycloak validates credentials
4. Keycloak redirects back with authorization code:
   ```
   http://localhost:3333/api/auth/callback?code=<auth-code>&state=<state>
   ```

#### **Step 3: Token Exchange** (`/api/auth/callback`)

**What happens**:
1. Controller receives authorization code and state
2. **CSRF Protection**: Verifies `state` matches session state
3. **Token Exchange**: Calls `exchangeCodeForTokens()`:
   - Sends authorization code + code verifier to Keycloak
   - Keycloak validates code verifier matches code challenge
   - Keycloak returns JWT tokens:
     - `access_token` - Short-lived token for API calls
     - `refresh_token` - Long-lived token to get new access tokens
     - `id_token` - Contains user identity information
4. **Session Storage**: Tokens stored in Express session:
   ```typescript
   session.accessToken = tokens.access_token;
   session.refreshToken = tokens.refresh_token;
   session.idToken = tokens.id_token;
   ```
5. **Cleanup**: Removes PKCE data from session
6. **Redirect**: User redirected to home page (`/`)

---

### 3. **Token Validation & User Extraction**

#### **A. ViewUserMiddleware** (For HTML Views)

**File**: `src/common/middleware/view-user.middleware.ts`

**Applied to**: All routes (configured in `app.module.ts`)

**What it does**:
1. Checks if session has `accessToken`
2. **Decodes JWT** (without verification - just extracts payload):
   - Splits token: `header.payload.signature`
   - Decodes payload (base64url)
   - Checks expiration
3. **Attaches user to request**:
   ```typescript
   req.user = {
     userId: payload.sub,  // Keycloak user ID
     sub: payload.sub,
     id: payload.sub,
     email: payload.email,
     username: payload.preferred_username,
     name: payload.name,
     roles: payload.realm_access?.roles
   }
   ```
4. **Makes user available to Handlebars templates**:
   ```typescript
   res.locals.user = req['viewUser'];
   res.locals.isAuthenticated = true;
   ```

**Why**: Allows templates to conditionally render content based on auth status.

#### **B. JWT Strategy** (For API Protection)

**File**: `src/modules/identity/application/strategies/jwt.strategy.ts`

**What it does**:
1. **Extracts token** from:
   - `Authorization: Bearer <token>` header (for API calls)
   - OR `session.accessToken` (for HTML views)
2. **Validates token**:
   - Verifies signature using Keycloak public key (RS256)
   - Checks expiration
   - Validates issuer (`http://localhost:8080/realms/b2b-ecommerce`)
   - Validates audience (`ecommerce-app`)
3. **Extracts user info** from JWT payload:
   ```typescript
   {
     id: payload.sub,
     email: payload.email,
     username: payload.preferred_username,
     name: payload.name,
     roles: payload.realm_access?.roles,
     clientRoles: payload.resource_access?.[clientId]?.roles
   }
   ```

---

### 4. **Route Protection**

#### **JwtAuthGuard**

**File**: `src/modules/identity/application/guards/jwt-auth.guard.ts`

**How it works**:
1. Checks if route is marked as `@Public()` → allows access
2. Checks if `req.user` already set (by ViewUserMiddleware) → allows access
3. If session has `accessToken` or `Authorization` header → triggers JWT Strategy
4. If authentication fails → throws `UnauthorizedException`

**Fallback handling**:
- If Passport validation fails but session has token → manually decodes JWT
- Creates user object from decoded payload
- Allows request to proceed

**Usage**:
```typescript
@Controller('orders')
@UseGuards(JwtAuthGuard)  // Protects all routes in controller
export class OrderController {
  @Get()
  async getOrders(@User() user: any) {
    // user is automatically injected from JWT
  }
}
```

---

### 5. **Token Refresh**

**Endpoint**: `/api/auth/refresh`

**What happens**:
1. Checks if session has `refreshToken`
2. Calls Keycloak token endpoint with refresh token
3. Gets new `access_token` and optionally new `refresh_token`
4. Updates session with new tokens

**When to use**: When access token expires (typically after 5-15 minutes).

---

### 6. **Logout**

**Endpoint**: `/api/auth/logout` or `/logout`

**What happens**:
1. If refresh token exists → calls Keycloak logout endpoint to invalidate token
2. Destroys Express session (removes all session data)
3. Redirects to home page

---

## Security Features

### ✅ **PKCE (Proof Key for Code Exchange)**
- Prevents authorization code interception
- Code verifier never sent to Keycloak until token exchange
- Code challenge is SHA256 hash, not reversible

### ✅ **CSRF Protection**
- State parameter generated and stored in session
- State must match on callback
- Prevents cross-site request forgery

### ✅ **Session Security**
- Tokens stored server-side in Express session
- Session cookie is `httpOnly` (not accessible via JavaScript)
- Session cookie uses `sameSite: 'lax'` (CSRF protection)

### ✅ **JWT Validation**
- Signature verification using Keycloak public key
- Expiration checking
- Issuer and audience validation

### ✅ **No Password Storage**
- Application never sees user passwords
- Credentials only sent to Keycloak
- Reduces attack surface

---

## Data Flow Diagrams

### Login Flow
```
User → /login
  ↓
AuthController.login()
  ↓
Generate PKCE (verifier + challenge)
Generate state
Store in session
  ↓
Redirect to Keycloak
  ↓
User enters credentials on Keycloak
  ↓
Keycloak validates
  ↓
Redirect to /api/auth/callback?code=...&state=...
  ↓
AuthController.callback()
  ↓
Verify state (CSRF check)
Exchange code for tokens
Store tokens in session
  ↓
Redirect to /
```

### Request Flow (Authenticated)
```
Request → ViewUserMiddleware
  ↓
Check session.accessToken
  ↓
Decode JWT payload
Check expiration
  ↓
Attach user to req.user
Attach user to res.locals.user
  ↓
Request → Route Handler
  ↓
JwtAuthGuard checks req.user
  ↓
If protected route → validate token
  ↓
Execute handler with @User() decorator
```

### API Request Flow
```
Request with Authorization: Bearer <token>
  ↓
JwtAuthGuard
  ↓
JWT Strategy extracts token from header
  ↓
Validate token (signature, expiration, issuer)
  ↓
Extract user from payload
  ↓
Attach to req.user
  ↓
Execute handler
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/config/keycloak.config.ts` | Keycloak configuration |
| `src/modules/identity/presentation/controllers/auth.controller.ts` | Login/logout/callback endpoints |
| `src/modules/identity/application/services/keycloak-auth.service.ts` | Keycloak API interactions |
| `src/modules/identity/application/strategies/jwt.strategy.ts` | JWT token validation |
| `src/modules/identity/application/guards/jwt-auth.guard.ts` | Route protection |
| `src/common/middleware/view-user.middleware.ts` | User extraction for views |
| `src/main.ts` | Session configuration |

---

## Environment Variables

```env
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=b2b-ecommerce
KEYCLOAK_CLIENT_ID=ecommerce-app
KEYCLOAK_CLIENT_SECRET=  # Optional for public clients
KEYCLOAK_CALLBACK_URL=http://localhost:3333/api/auth/callback
SESSION_SECRET=change-me-in-production
```

---

## Testing Authentication

### Check if authenticated:
```typescript
// In controller
@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@User() user: any) {
  return user; // Automatically injected from JWT
}
```

### In Handlebars template:
```handlebars
{{#if isAuthenticated}}
  <p>Welcome, {{user.name}}!</p>
{{else}}
  <a href="/login">Sign In</a>
{{/if}}
```

---

## Summary

1. **Keycloak** handles all authentication (credentials, MFA, password reset)
2. **OAuth 2.0 with PKCE** ensures secure token exchange
3. **JWT tokens** stored in Express session (server-side)
4. **ViewUserMiddleware** extracts user info for HTML views
5. **JWT Strategy** validates tokens for API protection
6. **JwtAuthGuard** protects routes automatically
7. **No passwords** ever touch the application

This architecture follows industry best practices and provides a secure, scalable authentication system.

