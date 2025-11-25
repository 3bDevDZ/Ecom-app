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
     userId: payload.sub, // Keycloak user ID
     sub: payload.sub,
     id: payload.sub,
     email: payload.email,
     username: payload.preferred_username,
     name: payload.name,
     roles: payload.realm_access?.roles,
   };
   ```
4. **Makes user available to Handlebars templates**:
   ```typescript
   res.locals.user = req["viewUser"];
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
@Controller("orders")
@UseGuards(JwtAuthGuard) // Protects all routes in controller
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

| File                                                                 | Purpose                         |
| -------------------------------------------------------------------- | ------------------------------- |
| `src/config/keycloak.config.ts`                                      | Keycloak configuration          |
| `src/modules/identity/presentation/controllers/auth.controller.ts`   | Login/logout/callback endpoints |
| `src/modules/identity/application/services/keycloak-auth.service.ts` | Keycloak API interactions       |
| `src/modules/identity/application/strategies/jwt.strategy.ts`        | JWT token validation            |
| `src/modules/identity/application/guards/jwt-auth.guard.ts`          | Route protection                |
| `src/common/middleware/view-user.middleware.ts`                      | User extraction for views       |
| `src/main.ts`                                                        | Session configuration           |

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

---

## User Management

### Overview

Since this application uses **Keycloak** as the Identity Provider, all user management operations are handled through Keycloak. The application does **not** store user credentials or manage users directly. Instead, it delegates all user management to Keycloak.

### User Management Operations

#### 1. **Creating Users**

**Option A: Via Keycloak Admin Console**

1. Navigate to Keycloak Admin Console: `http://localhost:8080`
2. Login with admin credentials
3. Select realm: `b2b-ecommerce`
4. Go to **Users** → **Create new user**
5. Fill in:
   - **Username** (required)
   - **Email** (required)
   - **First Name** (optional)
   - **Last Name** (optional)
   - ✅ **Email verified**: `ON` (for production)
   - ✅ **Enabled**: `ON`
6. Click **"Create"**
7. Set password:
   - Go to **"Credentials"** tab
   - Click **"Set password"**
   - Enter password
   - ✅ **Temporary**: `OFF` (unless you want user to change it on first login)
   - Click **"Save"**

**Option B: Via Keycloak Admin Client API**

```typescript
import { KeycloakAdminClient } from "@keycloak/keycloak-admin-client";

const keycloakAdmin = new KeycloakAdminClient({
  baseUrl: "http://localhost:8080",
  realmName: "b2b-ecommerce",
});

// Authenticate as admin
await keycloakAdmin.auth({
  grantType: "password",
  clientId: "admin-cli",
  username: "admin",
  password: "admin",
});

// Create user
const user = await keycloakAdmin.users.create({
  username: "newuser",
  email: "newuser@example.com",
  firstName: "New",
  lastName: "User",
  enabled: true,
  emailVerified: true,
  credentials: [
    {
      type: "password",
      value: "secure-password",
      temporary: false,
    },
  ],
});
```

**Option C: Using Seed Script**

The application includes a seed script: `src/scripts/seed-keycloak-users.ts`

```bash
npm run seed:keycloak
```

This script creates test users with predefined credentials.

---

#### 2. **Updating Users**

**Via Keycloak Admin Console:**

1. Go to **Users** → Find user → Click on username
2. Edit fields (username, email, name, etc.)
3. Click **"Save"**

**Via Admin Client API:**

```typescript
// Update user
await keycloakAdmin.users.update(
  { id: userId },
  {
    email: "updated@example.com",
    firstName: "Updated",
    lastName: "Name",
  }
);
```

---

#### 3. **Deleting Users**

**Via Keycloak Admin Console:**

1. Go to **Users** → Find user
2. Click **"Delete"** button
3. Confirm deletion

**Via Admin Client API:**

```typescript
await keycloakAdmin.users.del({ id: userId });
```

---

#### 4. **Disabling/Enabling Users**

**Via Keycloak Admin Console:**

1. Go to **Users** → Find user
2. Toggle **"Enabled"** switch
3. Click **"Save"**

**Via Admin Client API:**

```typescript
await keycloakAdmin.users.update(
  { id: userId },
  { enabled: false } // or true to enable
);
```

---

#### 5. **Assigning Roles**

**Via Keycloak Admin Console:**

1. Go to **Users** → Find user → **"Role Mappings"** tab
2. Click **"Assign role"**
3. Select roles (realm roles or client roles)
4. Click **"Assign"**

**Via Admin Client API:**

```typescript
// Get available roles
const roles = await keycloakAdmin.roles.find();

// Assign role to user
await keycloakAdmin.users.addRealmRoleMappings({
  id: userId,
  roles: [{ id: roleId, name: "user" }],
});
```

---

#### 6. **Listing Users**

**Via Admin Client API:**

```typescript
// Get all users
const users = await keycloakAdmin.users.find({ max: 100 });

// Search users
const users = await keycloakAdmin.users.find({
  username: "john",
  email: "john@example.com",
  exact: false, // partial match
});
```

---

## Password Reset / Forgot Password

### Overview

Password reset functionality is **handled entirely by Keycloak**. The application does not implement its own password reset flow. Users can reset their passwords through Keycloak's built-in password reset features.

### Implementation Options

#### **Option 1: Keycloak's Built-in Password Reset (Recommended)**

Keycloak provides a built-in password reset flow that can be accessed directly:

**URL Format:**

```
http://localhost:8080/realms/b2b-ecommerce/login-actions/reset-credentials
```

**How to Integrate:**

1. **Add "Forgot Password" Link to Login Page**

   In your login template (`src/views/pages/login.hbs`):

   ```handlebars
   <div class="mt-4 text-center">
     <a
       href="http://localhost:8080/realms/b2b-ecommerce/login-actions/reset-credentials?client_id=ecommerce-app&redirect_uri=http://localhost:3333/login"
       class="text-primary hover:underline"
     >
       Forgot Password?
     </a>
   </div>
   ```

2. **Configure Keycloak Email Settings**
   - Go to Keycloak Admin Console → **Realm Settings** → **Email**
   - Configure SMTP settings:
     - **Host**: Your SMTP server (e.g., `smtp.gmail.com`)
     - **Port**: `587` (TLS) or `465` (SSL)
     - **From**: `noreply@yourdomain.com`
     - **Authentication**: Enable if required
     - **Username**: SMTP username
     - **Password**: SMTP password
   - Click **"Save"**
   - Test email configuration with **"Test connection"** button

3. **Enable Email Actions**
   - Go to **Realm Settings** → **Login**
   - Enable **"Forgot Password"** action
   - Enable **"Email as username"** if you want users to login with email

**Flow:**

1. User clicks "Forgot Password" link
2. Redirected to Keycloak password reset page
3. User enters email/username
4. Keycloak sends password reset email
5. User clicks link in email
6. User sets new password on Keycloak page
7. User redirected back to application login page

---

#### **Option 2: Custom Password Reset Endpoint (Advanced)**

If you need more control over the password reset flow, you can create a custom endpoint that uses Keycloak Admin Client:

**Create Password Reset Service:**

```typescript
// src/modules/identity/application/services/password-reset.service.ts
import { Injectable } from "@nestjs/common";
import { KeycloakAdminClient } from "@keycloak/keycloak-admin-client";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PasswordResetService {
  private keycloakAdmin: KeycloakAdminClient;

  constructor(private configService: ConfigService) {
    this.keycloakAdmin = new KeycloakAdminClient({
      baseUrl: this.configService.get("KEYCLOAK_URL"),
      realmName: "master",
    });
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    // Authenticate as admin
    await this.keycloakAdmin.auth({
      grantType: "password",
      clientId: "admin-cli",
      username: this.configService.get("KEYCLOAK_ADMIN_USER"),
      password: this.configService.get("KEYCLOAK_ADMIN_PASSWORD"),
    });

    // Switch to target realm
    this.keycloakAdmin.setConfig({
      realmName: this.configService.get("KEYCLOAK_REALM"),
    });

    // Find user by email
    const users = await this.keycloakAdmin.users.find({
      email: email,
      exact: true,
    });

    if (users.length === 0) {
      throw new Error("User not found");
    }

    // Send password reset email
    await this.keycloakAdmin.users.executeActionsEmail({
      id: users[0].id,
      actions: ["UPDATE_PASSWORD"],
      clientId: this.configService.get("KEYCLOAK_CLIENT_ID"),
    });
  }
}
```

**Add Controller Endpoint:**

```typescript
// In src/modules/identity/presentation/controllers/auth.controller.ts

@Post('forgot-password')
async forgotPassword(@Body() body: { email: string }) {
  try {
    await this.passwordResetService.sendPasswordResetEmail(body.email);
    return { message: 'Password reset email sent' };
  } catch (error) {
    // Don't reveal if user exists or not (security best practice)
    return { message: 'If the email exists, a password reset link has been sent' };
  }
}
```

---

### Email Configuration

#### **Development (MailHog)**

For local development, use MailHog to capture emails:

1. **Start MailHog** (if using Docker Compose, it should be included)
2. **Configure Keycloak:**
   - **Host**: `mailhog` (or `localhost` if not in Docker)
   - **Port**: `1025`
   - **From**: `noreply@b2b-ecommerce.com`
   - **Authentication**: Disabled
3. **View Emails**: Open `http://localhost:8025` (MailHog UI)

#### **Production (SMTP)**

Configure real SMTP settings:

```env
# Keycloak Email Settings (configure in Admin Console)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_FROM=noreply@yourdomain.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_AUTH=true
SMTP_STARTTLS=true
```

---

## Email Validation

### Overview

Email validation in Keycloak can be configured at multiple levels:

### 1. **Email Verification on Registration**

**Configure in Keycloak:**

1. Go to **Realm Settings** → **Login**
2. Enable **"Email as username"** (optional)
3. Enable **"User registration"** (if allowing self-registration)
4. Go to **Realm Settings** → **Email**
5. Configure SMTP settings (see above)
6. Enable **"Verify email"** action

**Flow:**

1. User registers (if self-registration enabled)
2. Keycloak sends verification email
3. User clicks verification link
4. Email is marked as verified
5. User can now login

---

### 2. **Requiring Email Verification**

**Configure in Keycloak:**

1. Go to **Realm Settings** → **Login**
2. Enable **"Require email verification"**
3. Users with unverified emails cannot login

**Check Email Verification Status:**

```typescript
// Via Admin Client API
const user = await keycloakAdmin.users.findOne({ id: userId });
const isEmailVerified = user.emailVerified;
```

---

### 3. **Manual Email Verification**

**Via Keycloak Admin Console:**

1. Go to **Users** → Find user
2. Toggle **"Email verified"** switch
3. Click **"Save"**

**Via Admin Client API:**

```typescript
await keycloakAdmin.users.update({ id: userId }, { emailVerified: true });
```

---

### 4. **Resending Verification Email**

**Via Keycloak Admin Console:**

1. Go to **Users** → Find user → **"Credentials"** tab
2. Click **"Send email"** → Select **"Verify email"**
3. Click **"Send"**

**Via Admin Client API:**

```typescript
await keycloakAdmin.users.executeActionsEmail({
  id: userId,
  actions: ["VERIFY_EMAIL"],
  clientId: "ecommerce-app",
});
```

---

## Additional Authentication Features

### 1. **Account Lockout**

**Configure in Keycloak:**

1. Go to **Realm Settings** → **Security Defenses** → **Brute Force Detection**
2. Enable **"Brute Force Detection"**
3. Configure:
   - **Max Login Failures**: `5` (default)
   - **Wait Increment**: `60` seconds
   - **Max Wait**: `900` seconds (15 minutes)
   - **Min Quick Login Wait**: `60` seconds
   - **Max Delta Time Seconds**: `43200` (12 hours)
   - **Failure Reset Time**: `43200` seconds

**What it does:**

- After N failed login attempts, account is temporarily locked
- Lockout duration increases with each failure
- Prevents brute force attacks

---

### 2. **Password Policies**

**Configure in Keycloak:**

1. Go to **Realm Settings** → **Security** → **Password Policy**
2. Add policies:
   - **"length"** (minimum length): `8`
   - **"uppercase"** (require uppercase): `1`
   - **"lowercase"** (require lowercase): `1`
   - **"digits"** (require digits): `1`
   - **"specialChars"** (require special chars): `1`
   - **"notUsername"** (password ≠ username)
   - **"notEmail"** (password ≠ email)
   - **"hashAlgorithm"** (hashing algorithm): `pbkdf2-sha256`

**Example Policy String:**

```
length(8) and uppercase(1) and lowercase(1) and digits(1) and specialChars(1) and notUsername and notEmail
```

---

### 3. **Session Management**

**Configure in Keycloak:**

1. Go to **Realm Settings** → **Sessions**
2. Configure:
   - **SSO Session Idle**: `1800` seconds (30 minutes)
   - **SSO Session Max**: `36000` seconds (10 hours)
   - **SSO Session Idle Remember Me**: `0` (disabled)
   - **SSO Session Max Remember Me**: `0` (disabled)
   - **Client Session Idle**: `1800` seconds
   - **Client Session Max**: `36000` seconds

**View Active Sessions:**

```typescript
// Via Admin Client API
const sessions = await keycloakAdmin.users.listSessions({ id: userId });
```

**Logout All Sessions:**

```typescript
await keycloakAdmin.users.logout({ id: userId });
```

---

### 4. **Two-Factor Authentication (2FA)**

**Configure in Keycloak:**

1. Go to **Realm Settings** → **Authentication** → **Flows**
2. Copy **"Browser"** flow → Name it **"Browser with 2FA"**
3. Add **"OTP Form"** execution
4. Set as **"Required"**
5. Go to **Bindings** → Set **"Browser"** flow to **"Browser with 2FA"**

**Supported Methods:**

- **TOTP** (Time-based One-Time Password) - Google Authenticator, Authy
- **SMS OTP** (requires SMS provider configuration)
- **WebAuthn** (hardware keys, biometrics)

---

### 5. **Social Login (OAuth/OpenID Connect)**

**Configure in Keycloak:**

1. Go to **Identity Providers**
2. Add provider (Google, Facebook, GitHub, etc.)
3. Configure:
   - **Client ID** (from provider)
   - **Client Secret** (from provider)
   - **Default Scopes**: `openid profile email`
4. Enable **"Trust Email"** if provider verifies emails
5. Map user attributes (email, username, etc.)

**Flow:**

1. User clicks "Login with Google"
2. Redirected to Google OAuth
3. User authorizes
4. Google redirects back to Keycloak
5. Keycloak creates/links user account
6. User redirected to application

---

### 6. **User Self-Registration**

**Enable in Keycloak:**

1. Go to **Realm Settings** → **Login**
2. Enable **"User registration"**
3. Configure registration form fields
4. Enable **"Email as username"** (optional)
5. Enable **"Email verification"** (recommended)

**Customize Registration Form:**

1. Go to **Realm Settings** → **User Profile**
2. Configure required/optional fields
3. Add custom attributes

**Registration URL:**

```
http://localhost:8080/realms/b2b-ecommerce/protocol/openid-connect/registrations?client_id=ecommerce-app&redirect_uri=http://localhost:3333/login
```

---

### 7. **Account Linking**

Keycloak supports linking multiple identity providers to the same user account:

**Via Admin Client API:**

```typescript
// Link social account to existing user
await keycloakAdmin.users.addToFederatedIdentity({
  id: userId,
  federatedIdentityId: "google",
  federatedIdentity: {
    identityProvider: "google",
    userId: "google-user-id",
    userName: "user@gmail.com",
  },
});
```

---

## Environment Variables for User Management

```env
# Keycloak Admin Access (for programmatic user management)
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASSWORD=admin

# Keycloak Configuration
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=b2b-ecommerce
KEYCLOAK_CLIENT_ID=ecommerce-app

# Email Configuration (for password reset, verification)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_FROM=noreply@b2b-ecommerce.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

---

## Best Practices

### ✅ **User Management**

- Always use Keycloak Admin Client for programmatic user management
- Never store passwords in the application database
- Use temporary passwords for new users (force password change on first login)
- Regularly audit user accounts (disable inactive users)

### ✅ **Password Reset**

- Use Keycloak's built-in password reset flow (simplest and most secure)
- Configure proper SMTP settings for production
- Set reasonable expiration times for reset links (default: 1 hour)
- Log password reset attempts for security auditing

### ✅ **Email Validation**

- Always require email verification for new accounts
- Use email as username for better UX (optional)
- Resend verification emails if user requests
- Monitor email delivery rates

### ✅ **Security**

- Enable brute force detection
- Configure strong password policies
- Use HTTPS in production
- Regularly rotate admin credentials
- Enable 2FA for admin accounts

---

## Summary

1. **Keycloak** handles all authentication (credentials, MFA, password reset)
2. **OAuth 2.0 with PKCE** ensures secure token exchange
3. **JWT tokens** stored in Express session (server-side)
4. **ViewUserMiddleware** extracts user info for HTML views
5. **JWT Strategy** validates tokens for API protection
6. **JwtAuthGuard** protects routes automatically
7. **No passwords** ever touch the application
8. **User Management** is done through Keycloak (Admin Console or Admin Client API)
9. **Password Reset** uses Keycloak's built-in flow (redirect to Keycloak)
10. **Email Validation** is configured in Keycloak realm settings
11. **Additional Features** (2FA, social login, etc.) are configured in Keycloak

This architecture follows industry best practices and provides a secure, scalable authentication system with comprehensive user management capabilities.

---

## Quick Reference

| Feature                | Location                                             | Method                        |
| ---------------------- | ---------------------------------------------------- | ----------------------------- |
| **Create User**        | Keycloak Admin Console → Users                       | Manual or Admin Client API    |
| **Reset Password**     | Keycloak Login Page → Forgot Password                | Keycloak built-in flow        |
| **Verify Email**       | Keycloak Admin Console → Users → Email Verified      | Toggle or Admin Client API    |
| **Assign Roles**       | Keycloak Admin Console → Users → Role Mappings       | Manual or Admin Client API    |
| **Enable 2FA**         | Keycloak Realm Settings → Authentication → Flows     | Configure authentication flow |
| **Social Login**       | Keycloak Identity Providers                          | Add provider and configure    |
| **Password Policy**    | Keycloak Realm Settings → Security → Password Policy | Add policy rules              |
| **Session Management** | Keycloak Realm Settings → Sessions                   | Configure timeout values      |
