# JWT Refresh Token Explanation

## Overview

This application uses **JWT refresh tokens** to maintain user sessions without requiring frequent re-authentication. Refresh tokens are long-lived tokens that can be used to obtain new access tokens when the current access token expires.

---

## 🔑 Key Concepts

### **Access Token vs Refresh Token**

| Token Type        | Purpose                           | Lifetime             | Storage             |
| ----------------- | --------------------------------- | -------------------- | ------------------- |
| **Access Token**  | Used to authenticate API requests | Short (5-15 minutes) | Server-side session |
| **Refresh Token** | Used to obtain new access tokens  | Long (days/weeks)    | Server-side session |

### **Why Use Refresh Tokens?**

1. **Security**: Access tokens expire quickly, limiting damage if stolen
2. **User Experience**: Users don't need to re-login frequently
3. **Revocation**: Refresh tokens can be invalidated server-side
4. **Compliance**: Follows OAuth 2.0 best practices

---

## 📋 How Refresh Tokens Work in This Application

### **1. Initial Token Acquisition (Login)**

**File**: `src/modules/identity/presentation/controllers/auth.controller.ts`

**Flow**:

```
User logs in → Keycloak authentication → Token exchange
```

**Code** (lines 111-155):

```typescript
@Get('callback')
async callback(
  @Query('code') code: string,
  @Query('state') state: string,
  @Res() res: Response,
  @Session() session: Record<string, any>,
) {
  // Exchange authorization code for tokens
  const tokens = await this.keycloakAuthService.exchangeCodeForTokens(
    code,
    session.codeVerifier,
  );

  // Store tokens in session
  session.accessToken = tokens.access_token;      // ← Short-lived JWT
  session.refreshToken = tokens.refresh_token;    // ← Long-lived JWT
  session.idToken = tokens.id_token;             // ← Identity JWT

  // Redirect to home
  return res.redirect('/');
}
```

**What Keycloak Returns**:

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...", // JWT (5-15 min)
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...", // JWT (days/weeks)
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...", // JWT
  "expires_in": 300, // Access token expires in 5 minutes
  "refresh_expires_in": 1800 // Refresh token expires in 30 minutes
}
```

---

### **2. Token Refresh Endpoint**

**File**: `src/modules/identity/presentation/controllers/auth.controller.ts`

**Endpoint**: `GET /api/auth/refresh`

**Code** (lines 214-237):

```typescript
@Get('refresh')
async refresh(@Session() session: Record<string, any>, @Res() res: Response) {
  try {
    // Step 1: Check if refresh token exists
    if (!session.refreshToken) {
      return res.status(401).json({ message: 'No refresh token available' });
    }

    // Step 2: Exchange refresh token for new tokens
    const tokens = await this.keycloakAuthService.refreshToken(session.refreshToken);

    // Step 3: Update session with new tokens
    session.accessToken = tokens.access_token;  // ← New access token
    if (tokens.refresh_token) {
      session.refreshToken = tokens.refresh_token; // ← New refresh token (if rotated)
    }

    this.logger.log('Token refreshed successfully');
    return res.json({ message: 'Token refreshed' });
  } catch (error) {
    this.logger.error('Token refresh error', error);
    return res.status(401).json({ message: 'Token refresh failed' });
  }
}
```

**When to Call**:

- When access token expires (typically every 5-15 minutes)
- Before making API requests if token is about to expire
- Automatically by frontend JavaScript (if implemented)

---

### **3. Keycloak Token Refresh Service**

**File**: `src/modules/identity/application/services/keycloak-auth.service.ts`

**Method**: `refreshToken()` (lines 117-144)

**Code**:

```typescript
async refreshToken(refreshToken: string): Promise<any> {
  try {
    // Make HTTP POST request to Keycloak token endpoint
    const response = await fetch(
      `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',      // ← Tell Keycloak we're refreshing
          client_id: this.clientId,
          refresh_token: refreshToken,      // ← Send the refresh token
        }),
      },
    );

    if (!response.ok) {
      throw new UnauthorizedException('Failed to refresh token');
    }

    // Keycloak returns new tokens
    return await response.json();
  } catch (error) {
    this.logger.error('Token refresh error', error);
    throw new UnauthorizedException('Token refresh failed');
  }
}
```

**What Keycloak Does**:

1. Validates the refresh token (checks signature, expiration, revocation)
2. If valid, generates new access token and optionally new refresh token
3. Returns new tokens in response

**Keycloak Response**:

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...", // New JWT
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...", // New JWT (if rotated)
  "expires_in": 300,
  "refresh_expires_in": 1800
}
```

---

## 🔄 Complete Refresh Token Flow

### **Step-by-Step Process**

```
1. USER LOGS IN
   ↓
   AuthController.callback()
   ↓
   KeycloakAuthService.exchangeCodeForTokens()
   ↓
   Keycloak returns:
   - access_token (JWT, expires in 5 min)
   - refresh_token (JWT, expires in 30 min)
   ↓
   session.accessToken = tokens.access_token
   session.refreshToken = tokens.refresh_token
   ↓
   User is authenticated

2. USER MAKES REQUESTS
   ↓
   ViewUserMiddleware checks session.accessToken
   ↓
   Decodes JWT payload
   ↓
   Checks expiration
   ↓
   If expired → User needs to refresh token

3. ACCESS TOKEN EXPIRES (after 5 minutes)
   ↓
   Frontend/Backend detects expiration
   ↓
   Calls GET /api/auth/refresh
   ↓
   AuthController.refresh()
   ↓
   KeycloakAuthService.refreshToken(session.refreshToken)
   ↓
   POST to Keycloak /token endpoint with refresh_token
   ↓
   Keycloak validates refresh token
   ↓
   Keycloak returns new tokens
   ↓
   session.accessToken = new access_token
   session.refreshToken = new refresh_token (if rotated)
   ↓
   User continues using application

4. REFRESH TOKEN EXPIRES (after 30 minutes)
   ↓
   Refresh token is no longer valid
   ↓
   Token refresh fails
   ↓
   User must log in again
```

---

## 🛡️ Security Features

### **1. Token Storage**

**Location**: Server-side Express session (not in browser)

**Why**:

- Tokens are never exposed to JavaScript
- Protected from XSS attacks
- Session cookie is `httpOnly` (not accessible via JS)

**Code** (`src/main.ts`):

```typescript
app.use(
  session({
    secret: configService.get("app.sessionSecret"),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // ← Not accessible via JavaScript
      secure: false, // ← Set to true in production with HTTPS
      sameSite: "lax", // ← CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);
```

### **2. Token Validation**

**Access Token Validation**:

- Signature verification (RS256)
- Expiration checking
- Issuer validation
- Audience validation

**Refresh Token Validation**:

- Validated by Keycloak when used
- Can be revoked server-side
- Has its own expiration time

### **3. Token Rotation (Optional)**

**What is Token Rotation?**

- When refresh token is used, Keycloak can issue a NEW refresh token
- Old refresh token becomes invalid
- Prevents token replay attacks

**Current Implementation**:

```typescript
if (tokens.refresh_token) {
  session.refreshToken = tokens.refresh_token; // ← Update if rotated
}
```

**Note**: Keycloak may or may not rotate refresh tokens depending on configuration.

---

## 📍 Where Refresh Tokens Are Used

### **1. Manual Refresh Endpoint**

**Endpoint**: `GET /api/auth/refresh`

**Usage**:

```javascript
// Frontend JavaScript
fetch("/api/auth/refresh", {
  method: "GET",
  credentials: "include", // Include session cookie
})
  .then((response) => response.json())
  .then((data) => {
    console.log("Token refreshed:", data);
  });
```

### **2. Logout**

**File**: `src/modules/identity/presentation/controllers/auth.controller.ts`

**Code** (lines 164-208):

```typescript
@Get('logout')
async logout(@Req() req: Request, @Res() res: Response, @Session() session?: Record<string, any>) {
  // If refresh token exists, invalidate it on Keycloak
  if (session?.refreshToken) {
    await this.keycloakAuthService.logout(session.refreshToken);
  }

  // Destroy local session
  req.session.destroy(() => {
    res.redirect('/');
  });
}
```

**What Happens**:

1. Sends refresh token to Keycloak logout endpoint
2. Keycloak invalidates the refresh token
3. Local session is destroyed
4. User is logged out

### **3. Token Expiration Handling**

**File**: `src/common/middleware/view-user.middleware.ts`

**Code** (lines 20-90):

```typescript
if (req.session?.accessToken) {
  const tokenParts = req.session.accessToken.split(".");
  if (tokenParts.length === 3) {
    const payload = JSON.parse(
      Buffer.from(tokenParts[1], "base64url").toString("utf-8")
    );

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      // Token expired - user needs to refresh
      // Note: This middleware doesn't auto-refresh, it just detects expiration
      delete req.session.accessToken;
      delete req.session.refreshToken;
    } else {
      // Token is valid - attach user to request
      req.user = {
        userId: payload.sub,
        email: payload.email,
        // ...
      };
    }
  }
}
```

**Current Behavior**:

- Detects expired tokens
- Removes expired tokens from session
- Does NOT automatically refresh (manual refresh required)

---

## 🔧 Automatic Token Refresh (Not Currently Implemented)

### **Current State**

The application **does not automatically refresh tokens**. When an access token expires:

1. `ViewUserMiddleware` detects expiration
2. Removes expired token from session
3. User must manually call `/api/auth/refresh` or log in again

### **How to Implement Automatic Refresh**

**Option 1: Frontend JavaScript**

```javascript
// Check token expiration before API calls
async function makeAuthenticatedRequest(url, options = {}) {
  // Check if token is about to expire (within 1 minute)
  const tokenExpiry = getTokenExpiry(); // Get from JWT payload
  const now = Date.now() / 1000;

  if (tokenExpiry - now < 60) {
    // Token expires soon - refresh it
    await fetch("/api/auth/refresh", {
      method: "GET",
      credentials: "include",
    });
  }

  // Make the actual request
  return fetch(url, {
    ...options,
    credentials: "include",
  });
}
```

**Option 2: Backend Middleware**

```typescript
// Auto-refresh middleware
@Injectable()
export class AutoRefreshTokenMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    if (req.session?.accessToken && req.session?.refreshToken) {
      const token = req.session.accessToken;
      const payload = this.decodeJWT(token);

      // If token expires in less than 1 minute, refresh it
      const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
      if (expiresIn < 60) {
        try {
          const tokens = await this.keycloakAuthService.refreshToken(
            req.session.refreshToken
          );
          req.session.accessToken = tokens.access_token;
          if (tokens.refresh_token) {
            req.session.refreshToken = tokens.refresh_token;
          }
        } catch (error) {
          // Refresh failed - user needs to log in again
          delete req.session.accessToken;
          delete req.session.refreshToken;
        }
      }
    }
    next();
  }
}
```

---

## 📊 Token Lifecycle Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    TOKEN LIFECYCLE                           │
└─────────────────────────────────────────────────────────────┘

Login
  ↓
┌─────────────────────┐
│ Access Token        │  Expires: 5 minutes
│ (JWT)               │  Used for: API authentication
└─────────────────────┘
         │
         │ (expires)
         ↓
┌─────────────────────┐
│ Refresh Token       │  Expires: 30 minutes
│ (JWT)               │  Used for: Getting new access tokens
└─────────────────────┘
         │
         │ (used to refresh)
         ↓
┌─────────────────────┐
│ New Access Token    │  Expires: 5 minutes
│ (JWT)               │  User continues working
└─────────────────────┘
         │
         │ (refresh token expires)
         ↓
┌─────────────────────┐
│ Refresh Fails       │  User must log in again
└─────────────────────┘
```

---

## 🧪 Testing Refresh Token Flow

### **1. Test Manual Refresh**

```bash
# 1. Login first (get tokens in session)
curl -c cookies.txt http://localhost:3333/login

# 2. Wait for access token to expire (or manually expire it)

# 3. Call refresh endpoint
curl -b cookies.txt http://localhost:3333/api/auth/refresh

# Response:
# {
#   "message": "Token refreshed"
# }
```

### **2. Test Expired Refresh Token**

```bash
# 1. Get refresh token from session
# 2. Wait for it to expire (30 minutes)
# 3. Try to refresh
curl -b cookies.txt http://localhost:3333/api/auth/refresh

# Response:
# {
#   "message": "Token refresh failed"
# }
```

---

## 🔍 Keycloak Configuration

### **Token Lifetimes**

Configured in Keycloak Admin Console:

- **Realm Settings** → **Tokens**
  - **Access Token Lifespan**: 5 minutes (default)
  - **SSO Session Idle**: 30 minutes
  - **SSO Session Max**: 10 hours
  - **Refresh Token Max Reuse**: 0 (unlimited)

### **Refresh Token Behavior**

- **Refresh Token Rotation**: Can be enabled/disabled
- **Refresh Token Reuse**: How many times a refresh token can be used
- **Refresh Token Lifespan**: How long refresh token is valid

---

## 📝 Summary

1. **Refresh tokens are long-lived JWTs** stored in server-side sessions
2. **Used to obtain new access tokens** when current ones expire
3. **Manual refresh endpoint**: `GET /api/auth/refresh`
4. **No automatic refresh** currently implemented (manual only)
5. **Security**: Tokens stored server-side, never exposed to JavaScript
6. **Logout invalidates** refresh token on Keycloak
7. **Expiration handling** detects expired tokens but doesn't auto-refresh

---

## 🚀 Best Practices

1. **Implement automatic refresh** on frontend before token expires
2. **Handle refresh failures** gracefully (redirect to login)
3. **Monitor token expiration** and refresh proactively
4. **Use token rotation** if available for better security
5. **Log refresh attempts** for security auditing
6. **Set appropriate token lifetimes** based on security requirements

---

## 📚 Related Files

| File                                                                 | Purpose                              |
| -------------------------------------------------------------------- | ------------------------------------ |
| `src/modules/identity/presentation/controllers/auth.controller.ts`   | Refresh endpoint (line 214)          |
| `src/modules/identity/application/services/keycloak-auth.service.ts` | Refresh token service (line 117)     |
| `src/common/middleware/view-user.middleware.ts`                      | Token expiration detection (line 40) |
| `src/main.ts`                                                        | Session configuration                |

---

## 🔗 Related Documentation

- [JWT Usage Detailed](./JWT_USAGE_DETAILED.md)
- [Authentication Architecture](./AUTHENTICATION_ARCHITECTURE.md)
- [Authentication Flow Explanation](./AUTHENTICATION_FLOW_EXPLANATION.md)
