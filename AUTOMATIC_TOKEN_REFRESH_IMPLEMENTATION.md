# Automatic Token Refresh Implementation

## Overview

Automatic token refresh has been implemented to seamlessly maintain user sessions without requiring manual intervention. When an access token expires or is about to expire, the system automatically refreshes it using the refresh token.

---

## 🎯 Implementation Details

### **1. ViewUserMiddleware - Automatic Refresh for HTML Views**

**File**: `src/common/middleware/view-user.middleware.ts`

**What it does**:

- Runs on **every request** (applied to all routes)
- Checks if access token is expired or expires within **60 seconds**
- Automatically refreshes token if refresh token is available
- Updates session with new tokens
- Attaches user info to request for templates

**Key Features**:

- ✅ **Proactive refresh**: Refreshes tokens before they expire (60 second buffer)
- ✅ **Automatic**: No user action required
- ✅ **Graceful failure**: If refresh fails, clears session (user can log in again)
- ✅ **Transparent**: User doesn't notice the refresh happening

**Code Flow**:

```typescript
async use(req: Request, res: Response, next: NextFunction) {
  if (req.session?.accessToken) {
    // Decode token
    const payload = decodeJWT(req.session.accessToken);
    const expiresIn = payload.exp - currentTime;

    // If expires in less than 60 seconds, refresh
    if (expiresIn < 60 && req.session?.refreshToken) {
      try {
        // Refresh token
        const tokens = await this.keycloakAuthService.refreshToken(
          req.session.refreshToken
        );

        // Update session
        req.session.accessToken = tokens.access_token;
        if (tokens.refresh_token) {
          req.session.refreshToken = tokens.refresh_token;
        }

        // Decode new token and attach user info
        // ... attach user to request
      } catch (error) {
        // Refresh failed - clear session
        // User will need to log in again
      }
    }
  }
  next();
}
```

---

### **2. JwtAuthGuard - Automatic Refresh for API Routes**

**File**: `src/modules/identity/application/guards/jwt-auth.guard.ts`

**What it does**:

- Protects API routes with JWT authentication
- Checks token expiration before authentication
- Automatically refreshes expired tokens
- Works for both session-based and Bearer token authentication

**Key Features**:

- ✅ **API protection**: Works for protected API endpoints
- ✅ **Session tokens**: Refreshes tokens from session
- ✅ **Bearer tokens**: Also supports Authorization header tokens
- ✅ **Seamless**: API calls continue working even when tokens expire

**Code Flow**:

```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
  const request = context.switchToHttp().getRequest();

  if (request.session?.accessToken) {
    // Check expiration
    const payload = decodeJWT(request.session.accessToken);
    const expiresIn = payload.exp - currentTime;

    // Refresh if needed
    if (expiresIn < 60 && request.session?.refreshToken) {
      const tokens = await this.keycloakAuthService.refreshToken(
        request.session.refreshToken
      );
      request.session.accessToken = tokens.access_token;
      // ... update session
    }
  }

  // Continue with authentication
  return super.canActivate(context);
}
```

---

## 🔄 Complete Refresh Flow

### **Scenario 1: Token Expires During Active Session**

```
1. User is browsing the site
   ↓
2. ViewUserMiddleware runs on each request
   ↓
3. Checks: Token expires in 30 seconds (< 60s threshold)
   ↓
4. Automatically calls KeycloakAuthService.refreshToken()
   ↓
5. Keycloak validates refresh token and returns new tokens
   ↓
6. Session updated with new access_token and refresh_token
   ↓
7. User continues browsing (no interruption)
```

### **Scenario 2: Token Already Expired**

```
1. User makes request with expired access token
   ↓
2. ViewUserMiddleware detects expiration
   ↓
3. Checks if refresh token exists
   ↓
4. If yes: Refreshes token automatically
   ↓
5. If no: Clears session, user needs to log in
```

### **Scenario 3: Refresh Token Also Expired**

```
1. Access token expires
   ↓
2. System attempts to refresh
   ↓
3. Refresh token is also expired/invalid
   ↓
4. Refresh fails
   ↓
5. Session cleared
   ↓
6. User redirected to login (on next protected route)
```

---

## ⚙️ Configuration

### **Refresh Threshold**

**Current**: 60 seconds before expiration

**Location**: `src/common/middleware/view-user.middleware.ts` (line 40)

```typescript
const shouldRefresh = expiresIn < 60; // Refresh if expires in less than 60 seconds
```

**Why 60 seconds?**

- Gives enough time for refresh to complete
- Prevents race conditions
- Ensures token is valid for the entire request

**To change**: Modify the threshold value (in seconds)

---

## 🔍 How It Works

### **Step-by-Step Process**

1. **Request arrives** → `ViewUserMiddleware` runs first
2. **Check token** → Decode JWT payload to check expiration
3. **Calculate time** → `expiresIn = token.exp - currentTime`
4. **Decision**:
   - If `expiresIn < 60` AND `refreshToken` exists → **Refresh**
   - If `expiresIn >= 60` → **Use existing token**
   - If no `refreshToken` → **Clear session**
5. **Refresh process**:
   - Call `KeycloakAuthService.refreshToken(refreshToken)`
   - Keycloak validates and returns new tokens
   - Update session with new tokens
   - Decode new token and attach user info
6. **Continue** → Request proceeds with valid token

---

## 📊 Token Lifecycle with Auto-Refresh

```
┌─────────────────────────────────────────────────────────────┐
│              TOKEN LIFECYCLE WITH AUTO-REFRESH              │
└─────────────────────────────────────────────────────────────┘

Login
  ↓
┌─────────────────────┐
│ Access Token        │  Expires: 5 minutes
│ (JWT)               │  Valid for: 4 minutes 59 seconds
└─────────────────────┘
         │
         │ (4 minutes pass)
         ↓
┌─────────────────────┐
│ Access Token        │  Expires in: 59 seconds
│ (JWT)               │  ⚠️  Approaching expiration
└─────────────────────┘
         │
         │ (User makes request)
         ↓
┌─────────────────────┐
│ ViewUserMiddleware  │  Detects: expiresIn < 60s
│ Checks expiration   │  Action: Auto-refresh
└─────────────────────┘
         │
         │ (Refresh successful)
         ↓
┌─────────────────────┐
│ New Access Token    │  Expires: 5 minutes (new)
│ (JWT)               │  User continues seamlessly
└─────────────────────┘
         │
         │ (Cycle repeats)
         ↓
```

---

## 🛡️ Error Handling

### **Refresh Token Unavailable**

**Scenario**: User has access token but no refresh token

**Behavior**:

- Session cleared
- User marked as unauthenticated
- Next protected route requires login

**Code**:

```typescript
if (!req.session?.refreshToken) {
  // Clear session
  delete req.session.accessToken;
  req["viewUser"] = null;
  return next();
}
```

### **Refresh Token Expired**

**Scenario**: Refresh token is also expired/invalid

**Behavior**:

- Refresh attempt fails
- Session cleared
- User needs to log in again

**Code**:

```typescript
try {
  const tokens = await this.keycloakAuthService.refreshToken(refreshToken);
  // Success - update session
} catch (refreshError) {
  // Failure - clear session
  delete req.session.accessToken;
  delete req.session.refreshToken;
}
```

### **Keycloak Unavailable**

**Scenario**: Keycloak server is down or unreachable

**Behavior**:

- Refresh attempt fails
- Session cleared
- User needs to log in again when Keycloak is back

**Code**:

```typescript
catch (refreshError) {
  this.logger.warn('Token refresh failed', refreshError);
  // Clear session - user will need to log in again
}
```

---

## 🧪 Testing

### **Test 1: Automatic Refresh Before Expiration**

```bash
# 1. Login and get tokens
curl -c cookies.txt http://localhost:3333/login

# 2. Wait for token to be close to expiration (or manually expire it)

# 3. Make a request - should auto-refresh
curl -b cookies.txt http://localhost:3333/orders

# Expected: Request succeeds, new token in session
```

### **Test 2: Refresh Token Expired**

```bash
# 1. Login
curl -c cookies.txt http://localhost:3333/login

# 2. Wait for refresh token to expire (30 minutes)

# 3. Make request with expired access token
curl -b cookies.txt http://localhost:3333/orders

# Expected: Refresh fails, session cleared, redirect to login
```

### **Test 3: Manual Refresh Endpoint**

```bash
# Still works for manual refresh if needed
curl -b cookies.txt http://localhost:3333/api/auth/refresh

# Response:
# {
#   "message": "Token refreshed"
# }
```

---

## 📝 Key Implementation Points

### **1. Dependency Injection**

**ViewUserMiddleware** needs `KeycloakAuthService`:

- `KeycloakAuthService` is provided in `IdentityModule`
- `IdentityModule` exports `KeycloakAuthService`
- `AppModule` imports `IdentityModule`
- `ViewUserMiddleware` can inject `KeycloakAuthService`

**File**: `src/app.module.ts`

```typescript
@Module({
  imports: [
    IdentityModule, // ← Exports KeycloakAuthService
    // ...
  ],
  providers: [ViewUserMiddleware], // ← Can inject KeycloakAuthService
})
```

### **2. Async Middleware**

**Important**: Middleware method is now `async`:

```typescript
async use(req: Request, res: Response, next: NextFunction) {
  // Can use await for token refresh
  const tokens = await this.keycloakAuthService.refreshToken(...);
}
```

### **3. Session Update**

**Tokens are updated in session**:

```typescript
req.session.accessToken = tokens.access_token;
if (tokens.refresh_token) {
  req.session.refreshToken = tokens.refresh_token; // May be rotated
}
```

### **4. User Info Update**

**After refresh, user info is re-attached**:

```typescript
// Decode new token
const newPayload = decodeJWT(tokens.access_token);

// Attach user info
req['viewUser'] = { ... };
req.user = { ... };
res.locals.user = { ... };
```

---

## 🎨 User Experience

### **Before Implementation**

- ❌ User gets logged out when token expires
- ❌ User must manually refresh or log in again
- ❌ Interrupted workflow
- ❌ Poor user experience

### **After Implementation**

- ✅ User stays logged in automatically
- ✅ Seamless token refresh
- ✅ No interruption to workflow
- ✅ Better user experience

---

## 🔧 Configuration Options

### **Refresh Threshold**

**Current**: 60 seconds

**To change**: Modify in `ViewUserMiddleware`:

```typescript
const shouldRefresh = expiresIn < 60; // Change 60 to desired seconds
```

**Recommendations**:

- **30 seconds**: More frequent refreshes, safer
- **60 seconds**: Balanced (current)
- **120 seconds**: Less frequent, but risk of expiration during request

### **Token Lifetimes**

Configured in **Keycloak Admin Console**:

- **Realm Settings** → **Tokens**
  - **Access Token Lifespan**: 5 minutes (default)
  - **SSO Session Idle**: 30 minutes
  - **SSO Session Max**: 10 hours

---

## 📚 Related Files

| File                                                                 | Purpose                     |
| -------------------------------------------------------------------- | --------------------------- |
| `src/common/middleware/view-user.middleware.ts`                      | Auto-refresh for HTML views |
| `src/modules/identity/application/guards/jwt-auth.guard.ts`          | Auto-refresh for API routes |
| `src/modules/identity/application/services/keycloak-auth.service.ts` | Token refresh service       |
| `src/modules/identity/presentation/controllers/auth.controller.ts`   | Manual refresh endpoint     |
| `src/app.module.ts`                                                  | Module configuration        |

---

## 🚀 Benefits

1. **Seamless Experience**: Users don't get logged out unexpectedly
2. **Automatic**: No manual intervention required
3. **Proactive**: Refreshes before expiration
4. **Secure**: Tokens still expire, but refresh is automatic
5. **Transparent**: Users don't notice the refresh happening

---

## ⚠️ Important Notes

1. **Refresh tokens also expire**: After 30 minutes (configurable), user must log in again
2. **Network failures**: If Keycloak is unavailable, refresh fails and session is cleared
3. **Token rotation**: Keycloak may rotate refresh tokens (old one becomes invalid)
4. **Session storage**: Tokens are stored server-side, never exposed to JavaScript
5. **Manual refresh still works**: `/api/auth/refresh` endpoint remains available

---

## 🔗 Related Documentation

- [JWT Refresh Token Explanation](./JWT_REFRESH_TOKEN_EXPLANATION.md)
- [JWT Usage Detailed](./JWT_USAGE_DETAILED.md)
- [Authentication Architecture](./AUTHENTICATION_ARCHITECTURE.md)
