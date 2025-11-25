# JWT Usage - Exact Locations and Flow

## Yes, Your App Uses JWT! Here's Exactly Where and When

---

## 🔍 JWT Token Flow Overview

1. **Keycloak issues JWT tokens** (access_token, refresh_token, id_token)
2. **Tokens stored in Express session** (server-side)
3. **Tokens extracted and validated** in multiple places
4. **User info extracted from JWT payload**

---

## 📍 Exact Locations Where JWT is Used

### **1. Token Storage (After Login)**

**File**: `src/modules/identity/presentation/controllers/auth.controller.ts`

**Lines**: 138-140

```typescript
// After successful token exchange with Keycloak
session.accessToken = tokens.access_token; // ← JWT stored here
session.refreshToken = tokens.refresh_token; // ← JWT stored here
session.idToken = tokens.id_token; // ← JWT stored here
```

**When**: After user logs in via Keycloak callback (`/api/auth/callback`)

**What happens**: Keycloak returns JWT tokens, we store them in Express session.

---

### **2. JWT Extraction for HTML Views (Middleware)**

**File**: `src/common/middleware/view-user.middleware.ts`

**Lines**: 22-29, 63-73

```typescript
// Line 22: Check if session has JWT token
if (req.session?.accessToken) {
    try {
        // Line 26: Split JWT into parts (header.payload.signature)
        const tokenParts = req.session.accessToken.split('.');
        if (tokenParts.length === 3) {
            // Line 29: DECODE JWT PAYLOAD (base64url decode)
            const payload = JSON.parse(
                Buffer.from(tokenParts[1], 'base64url').toString('utf-8')
            );

            // Line 33: Check expiration
            const exp = payload.exp;
            if (exp && exp < currentTime) {
                // Token expired - clear it
            }

            // Line 49-73: Extract user info from JWT payload
            if (payload && payload.sub) {
                req.user = {
                    userId: payload.sub,      // From JWT
                    email: payload.email,     // From JWT
                    username: payload.preferred_username, // From JWT
                    roles: payload.realm_access?.roles    // From JWT
                };
            }
        }
    }
}
```

**When**: **EVERY HTTP REQUEST** (applied to all routes in `app.module.ts`)

**What happens**:

- Extracts JWT from session
- **Decodes** JWT payload (without verification - just reads it)
- Checks expiration
- Attaches user info to `req.user` and `res.locals.user`

**Why**: Makes user info available to Handlebars templates and controllers.

---

### **3. JWT Validation for API Protection (Passport Strategy)**

**File**: `src/modules/identity/application/strategies/jwt.strategy.ts`

**Lines**: 46-69, 75-91

```typescript
// Lines 46-59: Extract JWT from request
jwtFromRequest: (request: any) => {
    // Line 48: Try Authorization header first (Bearer token)
    const authHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
    if (authHeader) {
        return authHeader; // ← JWT from header
    }

    // Line 54: Fallback to session (for HTML views)
    if (request.session?.accessToken) {
        return request.session.accessToken; // ← JWT from session
    }

    return null;
},

// Lines 60-68: JWT Validation Configuration
{
    ignoreExpiration: false,  // ← Check expiration
    secretOrKey: secretOrKey,  // ← Keycloak public key (RS256)
    algorithms: ['RS256'],     // ← Verify signature with RS256
    issuer: 'http://localhost:8080/realms/b2b-ecommerce', // ← Verify issuer
    audience: 'ecommerce-app' // ← Verify audience
}

// Lines 75-91: Extract user from JWT payload
async validate(payload: any) {
    // payload is the DECODED JWT payload (after signature verification)
    return {
        id: payload.sub,                    // ← From JWT
        email: payload.email,               // ← From JWT
        username: payload.preferred_username, // ← From JWT
        name: payload.name,                 // ← From JWT
        roles: payload.realm_access?.roles, // ← From JWT
        clientRoles: payload.resource_access?.[clientId]?.roles // ← From JWT
    };
}
```

**When**: **Automatically triggered** when `JwtAuthGuard` is used on a route

**What happens**:

- **Extracts** JWT from `Authorization: Bearer <token>` header OR session
- **Validates** JWT signature using Keycloak public key (RS256)
- **Verifies** expiration, issuer, and audience
- **Decodes** payload and extracts user info
- **Returns** user object that gets attached to `req.user`

**This is the REAL JWT validation** - it verifies the signature!

---

### **4. JWT Guard (Route Protection)**

**File**: `src/modules/identity/application/guards/jwt-auth.guard.ts`

**Lines**: 19-47, 49-89

```typescript
// Lines 19-47: Check if route should be protected
canActivate(context: ExecutionContext) {
    // Check if route is public
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();

    // Line 34: Check if user already authenticated (from ViewUserMiddleware)
    if (request.user && request.user.userId) {
        return true; // Already authenticated
    }

    // Line 41: Check if JWT token exists
    if (request.session?.accessToken ||
        request.headers?.authorization?.startsWith('Bearer ')) {
        // Line 42: Trigger JWT Strategy validation
        return super.canActivate(context); // ← This calls JwtStrategy.validate()
    }

    throw new UnauthorizedException('Authentication required');
}

// Lines 49-89: Fallback JWT decoding (if Passport fails)
handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    // Line 60: If validation failed but session has token
    if ((err || !user) && request?.session?.accessToken) {
        try {
            // Line 63: Manually decode JWT (fallback)
            const tokenParts = request.session.accessToken.split('.');
            if (tokenParts.length === 3) {
                // Line 65: Decode payload
                const payload = JSON.parse(
                    Buffer.from(tokenParts[1], 'base64url').toString('utf-8')
                );

                if (payload && payload.sub) {
                    // Line 67-75: Create user object from JWT
                    return {
                        userId: payload.sub,  // ← From JWT
                        email: payload.email, // ← From JWT
                        // ... etc
                    };
                }
            }
        } catch (decodeError) {
            // Ignore
        }
    }
}
```

**When**: **Every request to a protected route** (routes with `@UseGuards(JwtAuthGuard)`)

**What happens**:

- Checks if route needs authentication
- If JWT exists → triggers `JwtStrategy` to validate it
- If validation fails → tries manual decode as fallback
- If no JWT → throws `UnauthorizedException`

**Used on**:

- `OrderController` (line 40)
- `CartController` (line 40)
- `ProductController` (lines 197, 225, 254)
- `CategoryController` (lines 162, 184, 206)
- `AuthController.getProfile()` (line 244)

---

### **5. JWT Decode (Keycloak Service)**

**File**: `src/modules/identity/application/services/keycloak-auth.service.ts`

**Lines**: 149-165

```typescript
// Line 149: Validate JWT token
async validateToken(token: string): Promise<any> {
    try {
        // Line 151: DECODE JWT (without verification)
        const decoded = this.jwtService.decode(token, { complete: true });

        if (!decoded) {
            throw new UnauthorizedException('Invalid token');
        }

        // Line 158: Verify with Keycloak userinfo endpoint
        const userInfo = await this.getUserInfo(token); // ← Uses JWT as Bearer token
        return userInfo;
    }
}

// Line 170: Get user info using JWT
async getUserInfo(accessToken: string): Promise<any> {
    const response = await fetch(
        `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/userinfo`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`, // ← JWT sent to Keycloak
            },
        },
    );
    return await response.json();
}
```

**When**: Called by `KeycloakStrategy.validate()` (line 29)

**What happens**:

- Decodes JWT to check structure
- Sends JWT to Keycloak `/userinfo` endpoint
- Keycloak validates JWT and returns user info

---

### **6. JWT Token Refresh**

**File**: `src/modules/identity/presentation/controllers/auth.controller.ts`

**Lines**: 214-237

```typescript
@Get('refresh')
async refresh(@Session() session: Record<string, any>, @Res() res: Response) {
    // Line 217: Check if refresh token exists
    if (!session.refreshToken) {
        return res.status(401).json({ message: 'No refresh token available' });
    }

    // Line 222: Exchange refresh token for new access token
    const tokens = await this.keycloakAuthService.refreshToken(session.refreshToken);

    // Line 225-228: Store new JWT tokens
    session.accessToken = tokens.access_token;  // ← New JWT
    if (tokens.refresh_token) {
        session.refreshToken = tokens.refresh_token; // ← New JWT
    }
}
```

**When**: When access token expires (typically every 5-15 minutes)

**What happens**: Uses refresh token (also a JWT) to get new access token from Keycloak.

---

## 🔄 Complete JWT Flow Diagram

```
1. USER LOGS IN
   ↓
   AuthController.login() → Redirects to Keycloak
   ↓
   User authenticates on Keycloak
   ↓
   Keycloak redirects with authorization code
   ↓
   AuthController.callback()
   ↓
   KeycloakAuthService.exchangeCodeForTokens()
   ↓
   Keycloak returns JWT tokens:
   - access_token (JWT)
   - refresh_token (JWT)
   - id_token (JWT)
   ↓
   session.accessToken = tokens.access_token  ← JWT STORED

2. USER MAKES REQUEST
   ↓
   ViewUserMiddleware (runs on EVERY request)
   ↓
   Checks: req.session?.accessToken
   ↓
   Decodes JWT payload (lines 26-29):
   - Split token: header.payload.signature
   - Decode payload: base64url decode
   - Check expiration
   - Extract user info
   ↓
   Attaches to req.user and res.locals.user

3. PROTECTED ROUTE ACCESS
   ↓
   JwtAuthGuard.canActivate()
   ↓
   Checks: session.accessToken OR Authorization header
   ↓
   Triggers: JwtStrategy.validate()
   ↓
   JwtStrategy:
   - Extracts JWT from header/session
   - Validates signature (RS256 with Keycloak public key)
   - Verifies expiration, issuer, audience
   - Decodes payload
   - Returns user object
   ↓
   User attached to req.user
   ↓
   Controller handler executes with @User() decorator
```

---

## 📊 JWT Usage Summary

| Location                       | What It Does              | When It Runs        | JWT Operation                |
| ------------------------------ | ------------------------- | ------------------- | ---------------------------- |
| `auth.controller.ts:138`       | Stores JWT in session     | After login         | **Store**                    |
| `view-user.middleware.ts:26`   | Decodes JWT for views     | **Every request**   | **Decode** (no verification) |
| `jwt.strategy.ts:48`           | Extracts JWT from request | When guard is used  | **Extract**                  |
| `jwt.strategy.ts:60-68`        | Validates JWT signature   | When guard is used  | **Validate** (RS256)         |
| `jwt.strategy.ts:75`           | Extracts user from JWT    | When guard is used  | **Decode payload**           |
| `jwt-auth.guard.ts:41`         | Checks for JWT            | Protected routes    | **Check exists**             |
| `jwt-auth.guard.ts:63`         | Fallback JWT decode       | If validation fails | **Decode** (fallback)        |
| `keycloak-auth.service.ts:151` | Decodes JWT structure     | Token validation    | **Decode**                   |
| `keycloak-auth.service.ts:176` | Sends JWT to Keycloak     | User info request   | **Use as Bearer token**      |

---

## 🎯 Key Points

1. **JWT is stored in Express session** after login (`session.accessToken`)
2. **JWT is decoded on EVERY request** by `ViewUserMiddleware` (for HTML views)
3. **JWT is validated** by `JwtStrategy` when accessing protected routes
4. **JWT signature is verified** using Keycloak's public key (RS256)
5. **JWT payload contains**: user ID (`sub`), email, username, roles
6. **JWT is used as Bearer token** when calling Keycloak APIs

---

## 🔍 How to See JWT in Action

### Check JWT in Session:

```typescript
// In any controller
console.log("JWT Token:", req.session?.accessToken);
```

### Decode JWT Manually:

```typescript
const token = req.session?.accessToken;
const parts = token.split(".");
const payload = JSON.parse(
  Buffer.from(parts[1], "base64url").toString("utf-8")
);
console.log("JWT Payload:", payload);
```

### See JWT Validation:

Add logging in `jwt.strategy.ts` line 75:

```typescript
async validate(payload: any) {
    console.log('JWT Payload received:', payload);
    // ... rest of code
}
```

---

## ✅ Answer: Yes, JWT is Used Extensively!

- **Stored**: After login in Express session
- **Decoded**: On every request by ViewUserMiddleware
- **Validated**: On protected routes by JwtStrategy
- **Used**: To identify users and authorize requests

The JWT tokens come from Keycloak and are used throughout the application for authentication and authorization.
