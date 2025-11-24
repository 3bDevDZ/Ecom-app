# JWT Usage in the Application - Exact Locations

## Yes, the app uses JWT! Here's exactly where and when:

---

## 🔑 JWT Tokens Come From Keycloak

**Location**: `src/modules/identity/presentation/controllers/auth.controller.ts`

**When**: After user logs in via Keycloak OAuth flow

```typescript
// Line 132-140: Token exchange
const tokens = await this.keycloakAuthService.exchangeCodeForTokens(
  code,
  session.codeVerifier,
);

// Store JWT tokens in session
session.accessToken = tokens.access_token;  // ← THIS IS A JWT TOKEN
session.refreshToken = tokens.refresh_token; // ← THIS IS A JWT TOKEN
session.idToken = tokens.id_token;          // ← THIS IS A JWT TOKEN
```

**What you get**: Keycloak returns 3 JWT tokens:
- `access_token` - JWT for API authentication (short-lived, ~5-15 min)
- `refresh_token` - JWT for getting new access tokens (long-lived)
- `id_token` - JWT containing user identity info

---

## 📍 Where JWT is Used (3 Main Places)

### 1. **ViewUserMiddleware** - For HTML Views (DECODE ONLY)

**File**: `src/common/middleware/view-user.middleware.ts`
**Lines**: 22-88
**Applied to**: ALL routes (configured in `app.module.ts`)

**What it does**:
- **DECODES** JWT (does NOT verify signature)
- Extracts user info for Handlebars templates
- Checks expiration manually

**Code**:
```typescript
// Line 22: Check if session has JWT token
if (req.session?.accessToken) {
  // Line 26: Split JWT into parts (header.payload.signature)
  const tokenParts = req.session.accessToken.split('.');

  if (tokenParts.length === 3) {
    // Line 29: DECODE payload (base64url decode)
    const payload = JSON.parse(
      Buffer.from(tokenParts[1], 'base64url').toString('utf-8')
    );

    // Line 32-35: Check expiration manually
    const currentTime = Math.floor(Date.now() / 1000);
    const exp = payload.exp;
    if (exp && exp < currentTime) {
      // Token expired - clear session
      delete req.session.accessToken;
    }

    // Line 49-73: Extract user info from JWT payload
    if (payload && payload.sub) {
      req.user = {
        userId: payload.sub,
        email: payload.email,
        username: payload.preferred_username,
        roles: payload.realm_access?.roles,
      };
    }
  }
}
```

**When it runs**: On EVERY request (middleware runs first)

**Why decode only**: Fast, no network call needed. Just extracts info for templates.

---

### 2. **JwtStrategy** - For Protected Routes (FULL VERIFICATION)

**File**: `src/modules/identity/application/strategies/jwt.strategy.ts`
**Lines**: 13-92
**Used by**: `JwtAuthGuard` when protecting routes

**What it does**:
- **VERIFIES** JWT signature using Keycloak public key
- **VALIDATES** expiration, issuer, audience
- Extracts user from verified payload

**Code**:
```typescript
// Line 46-59: Extract JWT from request
jwtFromRequest: (request: any) => {
  // Try Authorization header first (Bearer token)
  const authHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
  if (authHeader) {
    return authHeader; // ← JWT from API call
  }

  // Or from session (for HTML views)
  if (request.session?.accessToken) {
    return request.session.accessToken; // ← JWT from session
  }

  return null;
}

// Line 61: Configure verification
secretOrKey: keycloakPublicKey, // ← Uses Keycloak public key
algorithms: ['RS256'],           // ← Verifies signature
issuer: 'http://localhost:8080/realms/b2b-ecommerce', // ← Validates issuer
audience: 'ecommerce-app',     // ← Validates audience

// Line 75-91: Extract user from VERIFIED payload
async validate(payload: any) {
  return {
    id: payload.sub,
    email: payload.email,
    username: payload.preferred_username,
    roles: payload.realm_access?.roles,
  };
}
```

**When it runs**:
- When `@UseGuards(JwtAuthGuard)` is on a route
- When request has `Authorization: Bearer <token>` header OR session has `accessToken`

**Why verify**: Security - ensures token wasn't tampered with and is from Keycloak.

---

### 3. **JwtAuthGuard** - Route Protection

**File**: `src/modules/identity/application/guards/jwt-auth.guard.ts`
**Lines**: 14-90

**What it does**:
- Checks if route needs authentication
- Triggers `JwtStrategy` to verify JWT
- Falls back to manual decode if Passport fails

**Code**:
```typescript
// Line 19-28: Check if route is public
canActivate(context: ExecutionContext) {
  const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', ...);
  if (isPublic) {
    return true; // No JWT needed
  }

  // Line 34-36: Check if already authenticated (from ViewUserMiddleware)
  if (request.user && request.user.userId) {
    return true; // Already has user, skip JWT verification
  }

  // Line 41-42: Trigger JWT Strategy if token exists
  if (request.session?.accessToken || request.headers?.authorization?.startsWith('Bearer ')) {
    return super.canActivate(context); // ← THIS CALLS JwtStrategy.validate()
  }
}

// Line 49-81: Fallback - manual decode if Passport fails
handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
  // If Passport failed but session has token, decode manually
  if ((err || !user) && request?.session?.accessToken) {
    const tokenParts = request.session.accessToken.split('.');
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64url').toString('utf-8'));
    // Create user object from decoded payload
    return { userId: payload.sub, ... };
  }
}
```

**When it runs**:
- On routes decorated with `@UseGuards(JwtAuthGuard)`
- Examples:
  - `OrderController` (line 40)
  - `CartController` (line 40)
  - `ProductController` (lines 197, 225, 254)
  - `CategoryController` (lines 162, 184, 206)

---

## 🔄 Complete Flow: When JWT is Used

### Scenario 1: User Visits Protected Route (HTML View)

```
1. Request → /orders
   ↓
2. ViewUserMiddleware runs (ALL requests)
   - Checks session.accessToken (JWT)
   - DECODES JWT payload
   - Attaches user to req.user
   ↓
3. Route reaches OrderController
   ↓
4. JwtAuthGuard checks
   - Sees req.user already set (from middleware)
   - Allows request (line 34-36)
   ↓
5. Handler executes with @User() decorator
```

### Scenario 2: API Call with Bearer Token

```
1. Request → GET /api/orders
   Headers: Authorization: Bearer <JWT_TOKEN>
   ↓
2. ViewUserMiddleware runs
   - No session.accessToken
   - Sets req.user = null
   ↓
3. Route reaches OrderController
   ↓
4. JwtAuthGuard checks
   - Sees Authorization header
   - Calls super.canActivate() (line 42)
   ↓
5. JwtStrategy runs
   - Extracts JWT from Authorization header (line 48)
   - VERIFIES signature with Keycloak public key
   - VALIDATES expiration, issuer, audience
   - Extracts user from payload
   ↓
6. Handler executes with verified user
```

### Scenario 3: API Call with Session Token

```
1. Request → GET /api/orders
   Cookie: session with accessToken
   ↓
2. ViewUserMiddleware runs
   - Finds session.accessToken (JWT)
   - DECODES payload
   - Sets req.user
   ↓
3. Route reaches OrderController
   ↓
4. JwtAuthGuard checks
   - Sees req.user already set
   - Allows request
   ↓
5. Handler executes
```

---

## 📊 Summary Table

| Location | What It Does | Verification? | When |
|----------|--------------|---------------|------|
| **ViewUserMiddleware** | Decodes JWT payload | ❌ No (decode only) | Every request |
| **JwtStrategy** | Verifies JWT signature | ✅ Yes (full verification) | Protected routes |
| **JwtAuthGuard** | Triggers JwtStrategy | ✅ Yes (via strategy) | Routes with `@UseGuards(JwtAuthGuard)` |
| **JwtAuthGuard fallback** | Manual decode | ❌ No (fallback only) | If Passport fails |

---

## 🎯 Key Points

1. **JWT tokens are stored in session** after Keycloak login
2. **ViewUserMiddleware** decodes JWT on every request (for templates)
3. **JwtStrategy** fully verifies JWT when protecting routes
4. **JwtAuthGuard** uses JwtStrategy for route protection
5. **Two ways to authenticate**:
   - Session-based (JWT in session cookie)
   - Bearer token (JWT in Authorization header)

---

## 🔍 How to See JWT in Action

### Check if JWT exists in session:
```typescript
// In any controller
@Get('debug')
debug(@Req() req: any) {
  return {
    hasToken: !!req.session?.accessToken,
    tokenPreview: req.session?.accessToken?.substring(0, 50) + '...',
  };
}
```

### Decode JWT manually (for debugging):
```typescript
const token = req.session.accessToken;
const parts = token.split('.');
const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
console.log('JWT Payload:', payload);
// You'll see: sub, email, preferred_username, exp, iat, etc.
```

---

## 📝 Files That Use JWT

1. ✅ `src/modules/identity/presentation/controllers/auth.controller.ts` - Stores JWT in session
2. ✅ `src/common/middleware/view-user.middleware.ts` - Decodes JWT for views
3. ✅ `src/modules/identity/application/strategies/jwt.strategy.ts` - Verifies JWT
4. ✅ `src/modules/identity/application/guards/jwt-auth.guard.ts` - Uses JWT for protection
5. ✅ `src/modules/identity/application/services/keycloak-auth.service.ts` - Gets JWT from Keycloak

---

## 🚨 Important Distinction

**Decoding vs Verification**:
- **Decoding** (ViewUserMiddleware): Just reads the payload. Fast, but doesn't verify signature.
- **Verification** (JwtStrategy): Checks signature, expiration, issuer. Secure, but slower.

The app does BOTH:
- Decodes for speed (templates)
- Verifies for security (protected routes)

