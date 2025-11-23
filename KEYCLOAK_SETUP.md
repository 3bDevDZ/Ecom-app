# Keycloak Setup Guide for B2B E-Commerce Platform

This guide will help you set up Keycloak for authentication in your B2B E-Commerce Platform.

## Prerequisites

- Docker and Docker Compose installed
- Keycloak running in Docker (already configured in `docker-compose.yml`)

## Step 1: Start Keycloak with Docker

If Keycloak is not already running, start it:

```bash
# Start all services (including Keycloak)
docker-compose up -d

# Or start only Keycloak
docker-compose up -d keycloak

# Check if Keycloak is running
docker-compose ps keycloak
```

Wait about 60-90 seconds for Keycloak to fully start.

## Step 2: Access Keycloak Admin Console

1. Open your browser and go to: **http://localhost:8080/admin**
2. Login with default credentials:
   - **Username:** `admin`
   - **Password:** `admin` (or the value of `KEYCLOAK_ADMIN_PASSWORD` from your `.env`)

## Step 3: Create or Configure the Realm

### Option A: If realm doesn't exist, create it:

1. In the Keycloak Admin Console, click on the realm dropdown (top left) and select **"Create Realm"**
2. Enter realm name: **`b2b-ecommerce`**
3. Click **"Create"**

### Option B: If realm exists, select it:

1. Click on the realm dropdown (top left)
2. Select **"b2b-ecommerce"**

## Step 4: Configure the Client

### Create a new client (if it doesn't exist):

1. In the left sidebar, click **"Clients"**
2. Click **"Create client"** button
3. Configure the client:
   - **Client type:** `OpenID Connect`
   - **Client ID:** `ecommerce-app`
   - Click **"Next"**
4. Configure capabilities:
   - ✅ **Client authentication:** `OFF` (for public client with PKCE)
   - ✅ **Authorization:** `OFF`
   - ✅ **Standard flow:** `ON` (for authorization code flow)
   - ✅ **Direct access grants:** `ON` (optional, for testing)
   - ✅ **Implicit flow:** `OFF`
   - Click **"Next"**
5. Configure login settings:
   - **Root URL:** Leave empty or set to `http://localhost:3333`
   - **Home URL:** Leave empty or set to `http://localhost:3333`
   - **Valid redirect URIs:** `http://localhost:3333/api/auth/callback`
   - **Valid post logout redirect URIs:** `http://localhost:3333/*`
   - **Web origins:** `http://localhost:3333` (for CORS)
   - Click **"Save"**

### Update PKCE settings:

1. In the client settings, find the **"Advanced settings"** section
2. Set **"Proof Key for Code Exchange Code Challenge Method"** to: `S256`
3. Click **"Save"**

## Step 5: Get the Public Key

You need the realm public key for JWT token verification:

### Method 1: From Admin Console (Easiest)

1. In Keycloak Admin Console, go to **"Realm Settings"** (left sidebar)
2. Click on the **"Keys"** tab
3. Find the **"Active"** signing key (usually "RS256")
4. Copy the **"Public key"** value (it's a long string without line breaks)

### Method 2: From Realm Endpoint

Open in your browser or use curl:

```bash
# Get realm info including public key
curl http://localhost:8080/realms/b2b-ecommerce

# Or just get the public key field
curl http://localhost:8080/realms/b2b-ecommerce | grep -o '"public_key":"[^"]*"' | cut -d'"' -f4
```

The public key will look something like:
```
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...very long string...
```

## Step 6: Create Test Users

### Method 1: Using Admin Console

1. In Keycloak Admin Console, go to **"Users"** (left sidebar)
2. Click **"Create new user"**
3. Fill in:
   - **Username:** `user`
   - **Email:** `user@example.com`
   - ✅ **Email verified:** `ON`
   - ✅ **Enabled:** `ON`
   - Click **"Create"**
4. Set password:
   - Go to **"Credentials"** tab
   - Click **"Set password"**
   - **Password:** `user123`
   - ✅ **Temporary:** `OFF` (so user doesn't have to change it)
   - Click **"Save"**

Repeat for additional test users:
- `buyer1` / `buyer1@example.com` / `buyer123`
- `buyer2` / `buyer2@example.com` / `buyer123`

### Method 2: Using the Seed Script

We have a script to create users automatically:

```bash
# First, make sure you have KEYCLOAK_CLIENT_SECRET in your .env
npm run seed:keycloak
```

This will create:
- `user` / `user@example.com` / `user123`
- `buyer1` / `buyer1@example.com` / `buyer123`
- `buyer2` / `buyer2@example.com` / `buyer123`

## Step 7: Configure Environment Variables

Create or update your `.env` file in the project root:

```env
# Keycloak Configuration
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=b2b-ecommerce
KEYCLOAK_CLIENT_ID=ecommerce-app
KEYCLOAK_CLIENT_SECRET=  # Leave empty for public client with PKCE
KEYCLOAK_PUBLIC_KEY=<paste-the-public-key-here>
KEYCLOAK_CALLBACK_URL=http://localhost:3333/api/auth/callback

# Session Configuration (for OAuth flow)
SESSION_SECRET=your-random-session-secret-change-in-production

# Optional: JWT Secret (fallback if public key is not configured)
JWT_SECRET=development-secret-change-in-production
```

**Important:**
- Paste the public key from Step 5 into `KEYCLOAK_PUBLIC_KEY`
- For public clients with PKCE, `KEYCLOAK_CLIENT_SECRET` can be empty
- `SESSION_SECRET` should be a random string for session encryption

## Step 8: Test the Authentication Flow

1. **Start your application:**
   ```bash
   npm run start:dev
   ```

2. **Open the login page:**
   - Go to: **http://localhost:3333/login**
   - You should see the "Sign In to Your Account" page

3. **Click "Sign In with Keycloak":**
   - You'll be redirected to Keycloak login page
   - Enter credentials: `user` / `user123`
   - Click "Sign In"

4. **After successful login:**
   - You'll be redirected back to your application
   - You should now see product prices
   - You can add items to cart
   - Cart button should be visible in header

## Troubleshooting

### Keycloak not accessible
```bash
# Check if Keycloak is running
docker-compose ps keycloak

# Check Keycloak logs
docker-compose logs keycloak

# Restart Keycloak
docker-compose restart keycloak
```

### "Invalid redirect URI" error
- Make sure the redirect URI in Keycloak client settings matches exactly: `http://localhost:3333/api/auth/callback`
- Check that there are no trailing slashes

### "JwtStrategy requires a secret or key" error
- Make sure `KEYCLOAK_PUBLIC_KEY` is set in your `.env` file
- Restart your application after updating `.env`

### Can't login
- Verify user exists in Keycloak and is enabled
- Check user credentials in Keycloak Admin Console
- Make sure email is verified if email verification is required

### Public key not working
- Verify the public key is correct (no extra spaces or line breaks)
- Make sure Keycloak is accessible at `http://localhost:8080`
- Try fetching the public key again from Step 5

## Quick Reference

| Item | Value |
|------|-------|
| Keycloak URL | http://localhost:8080 |
| Admin Console | http://localhost:8080/admin |
| Admin Username | `admin` |
| Admin Password | `admin` (or from `KEYCLOAK_ADMIN_PASSWORD`) |
| Realm Name | `b2b-ecommerce` |
| Client ID | `ecommerce-app` |
| Callback URL | http://localhost:3333/api/auth/callback |
| Test User | `user` / `user123` |

## Next Steps

Once authentication is working:
1. Test the complete user flow: browse products, add to cart, checkout
2. Verify that unauthenticated users cannot see prices
3. Verify that authenticated users can see prices and add to cart
4. Test logout functionality

