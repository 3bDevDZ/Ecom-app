# Fix: Keycloak Not Redirecting Back After Login

## Problem

After logging in to Keycloak, it doesn't redirect back to our app. Instead, you get `ERR_CONNECTION_REFUSED` on `localhost/realms/b2b-ecommerce/login-actions/authenticate` (missing `:8080` port).

## Root Cause

Keycloak is generating redirect URLs without the port number because its hostname configuration isn't properly set for internal redirects.

## Solution

I've updated `docker-compose.yml` to include proper hostname configuration. Now you need to:

### Step 1: Stop and Start Keycloak

Keycloak needs a full restart (stop + start) to pick up the new configuration:

```bash
# Stop Keycloak
docker-compose stop keycloak

# Start Keycloak again
docker-compose start keycloak

# OR do both at once:
docker-compose restart keycloak
```

Wait about 30-60 seconds for Keycloak to be healthy:

```bash
docker-compose ps keycloak
# Should show: Up X minutes (healthy)
```

### Step 2: Verify Configuration in Keycloak Admin Console

1. **Access Keycloak Admin Console:**
   - Go to: http://localhost:8080/admin
   - Login: `admin` / `admin`

2. **Select Realm:**
   - Click realm dropdown (top left)
   - Select `b2b-ecommerce`

3. **Go to Realm Settings:**
   - Click **"Realm settings"** in left sidebar
   - Click **"General"** tab

4. **Check Frontend URL:**
   - **Frontend URL:** Should be empty or `http://localhost:8080`
   - If it's set incorrectly, clear it or set to `http://localhost:8080`

5. **Go to Clients:**
   - Click **"Clients"** in left sidebar
   - Click on **"ecommerce-app"** client

6. **Check Valid Redirect URIs:**
   - Make sure it includes: `http://localhost:3333/api/auth/callback`
   - Should be exactly: `http://localhost:3333/api/auth/callback` (no trailing slash)
   - Can also add wildcard: `http://localhost:3333/*` for testing

7. **Check Web Origins:**
   - **Web origins:** Should include `http://localhost:3333`
   - This is important for CORS

8. **Save Changes:**
   - Click **"Save"** at the bottom

### Step 3: Test the Flow Again

1. Go to: http://localhost:3333/login
2. Click "Sign In with Keycloak"
3. Should redirect to: `http://localhost:8080/realms/b2b-ecommerce/protocol/openid-connect/auth?...`
4. Enter credentials (e.g., `user` / `user123`)
5. After login, should redirect back to: `http://localhost:3333/api/auth/callback?code=...&state=...`
6. Then redirect to: http://localhost:3333/

### Alternative: If Still Not Working

If the issue persists after restarting, check Keycloak logs:

```bash
docker-compose logs keycloak | tail -50
```

Look for errors related to hostname or redirect URI.

You can also try setting the Frontend URL explicitly in Keycloak Admin Console:
1. Realm Settings > General > Frontend URL: `http://localhost:8080`
2. Save

## Updated Configuration

The `docker-compose.yml` now includes:
- `KC_HOSTNAME: localhost`
- `KC_HOSTNAME_PORT: 8080`
- `KC_HOSTNAME_ADMIN: localhost`
- `KC_HOSTNAME_ADMIN_PORT: 8080`
- `KC_PROXY_ADDRESS_FORWARDING: true`

This ensures Keycloak generates correct redirect URLs with the port number.

