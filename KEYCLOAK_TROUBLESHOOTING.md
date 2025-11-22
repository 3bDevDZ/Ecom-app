# Keycloak Troubleshooting Guide

## Issue: ERR_CONNECTION_REFUSED after login

If you see `ERR_CONNECTION_REFUSED` when trying to log in to Keycloak, it means Keycloak is redirecting to the wrong URL (missing port number `:8080`).

**Quick Fix:**

1. The `docker-compose.yml` has been updated to include the port in Keycloak's hostname.
2. Restart Keycloak to apply the changes:
   ```bash
   docker-compose restart keycloak
   ```
3. Wait for Keycloak to be healthy (about 30-60 seconds), then try logging in again.

### Solution 1: Check Keycloak Client Configuration

1. **Access Keycloak Admin Console:**
   - Go to: http://localhost:8080/admin
   - Login: `admin` / `admin`

2. **Select Realm:**
   - Click realm dropdown (top left)
   - Select `b2b-ecommerce`

3. **Go to Clients:**
   - Click **"Clients"** in left sidebar
   - Click on **"ecommerce-app"** client

4. **Check Valid Redirect URIs:**
   - Make sure it includes: `http://localhost:3333/api/auth/callback`
   - Should be exactly: `http://localhost:3333/api/auth/callback` (no trailing slash)
   - Can also add wildcard: `http://localhost:3333/*` for testing

5. **Check Root URL:**
   - **Root URL:** Should be `http://localhost:3333` or empty
   - **Base URL:** Should be `/` or empty
   - **Home URL:** Should be `http://localhost:3333` or empty

6. **Check Web Origins:**
   - **Web origins:** Should include `http://localhost:3333`
   - This is important for CORS

7. **Check Advanced Settings:**
   - **Proof Key for Code Exchange Code Challenge Method:** Should be `S256`
   - **Access token lifespan:** Default is fine

8. **Save Changes:**
   - Click **"Save"** at the bottom

### Solution 2: Verify Environment Variables

Make sure your `.env` file has the correct Keycloak URL:

```env
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=b2b-ecommerce
KEYCLOAK_CLIENT_ID=ecommerce-app
KEYCLOAK_CLIENT_SECRET=
KEYCLOAK_CALLBACK_URL=http://localhost:3333/api/auth/callback
```

### Solution 3: Check Keycloak is Running

```bash
# Check if Keycloak container is running
docker-compose ps keycloak

# Should show: Up X hours (healthy)

# Check Keycloak logs for errors
docker-compose logs keycloak | tail -50

# Restart Keycloak if needed
docker-compose restart keycloak
```

### Solution 4: Test Keycloak Directly

Open in browser:

- http://localhost:8080/realms/b2b-ecommerce/.well-known/openid-configuration

You should see JSON configuration. If you get connection refused, Keycloak is not running or accessible.

### Solution 5: Verify Callback URL Configuration

The callback URL in your app (`KEYCLOAK_CALLBACK_URL`) must match exactly what's configured in Keycloak:

**In Keycloak:**

- Valid redirect URIs: `http://localhost:3333/api/auth/callback`

**In .env:**

- KEYCLOAK_CALLBACK_URL=http://localhost:3333/api/auth/callback

These must match exactly (same protocol, host, port, path).

### Common Issues

1. **Port missing in redirect:**
   - Keycloak redirects to `localhost` instead of `localhost:8080`
   - Fix: Check Root URL in Keycloak client settings

2. **Invalid redirect URI:**
   - Keycloak shows "Invalid redirect URI" error
   - Fix: Make sure callback URL is in Valid redirect URIs list

3. **CORS errors:**
   - Browser blocks request due to CORS
   - Fix: Add `http://localhost:3333` to Web origins in Keycloak

4. **Session not persisting:**
   - Session is lost after redirect
   - Fix: Check SESSION_SECRET is set and cookies are enabled

### Testing the Flow

1. Go to: http://localhost:3333/login
2. Click "Sign In with Keycloak"
3. Should redirect to: http://localhost:8080/realms/b2b-ecommerce/protocol/openid-connect/auth?...
4. Enter credentials (e.g., `user` / `user123`)
5. After login, should redirect back to: http://localhost:3333/api/auth/callback?code=...&state=...
6. Then redirect to: http://localhost:3333/

If any step fails, check the server logs for error messages.
