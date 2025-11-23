# Fix: Keycloak Admin Console Stuck - Alternative Solutions

## Problem

Keycloak Admin Console at `http://localhost:8080/admin` is stuck on "Loading the Admin UI" screen and won't load.

## Solution 1: Try Direct Admin Console URL

Instead of `http://localhost:8080/admin`, try accessing the console directly:

```
http://localhost:8080/admin/master/console/
```

Or try the login URL with explicit parameters:

```
http://localhost:8080/realms/master/protocol/openid-connect/auth?client_id=security-admin-console&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fadmin%2Fmaster%2Fconsole%2F&response_type=code&scope=openid
```

## Solution 2: Use Keycloak REST API Instead

Since the Admin Console isn't working, you can configure Keycloak via REST API:

### Step 1: Get Admin Access Token

```bash
curl -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password"
```

This will return an access token. Copy it.

### Step 2: Update Client Configuration via API

```bash
# Replace YOUR_ACCESS_TOKEN with the token from Step 1
ACCESS_TOKEN="YOUR_ACCESS_TOKEN"

curl -X GET http://localhost:8080/admin/realms/b2b-ecommerce/clients?clientId=ecommerce-app \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Step 3: Update Redirect URIs

```bash
# Get client ID first (from previous call)
CLIENT_UUID="CLIENT_UUID_FROM_ABOVE"

curl -X PUT http://localhost:8080/admin/realms/b2b-ecommerce/clients/$CLIENT_UUID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "redirectUris": [
      "http://localhost:3333/api/auth/callback",
      "http://localhost:3333/*"
    ],
    "webOrigins": [
      "http://localhost:3333"
    ]
  }'
```

## Solution 3: Update Realm Export File

Instead of using the UI, you can directly edit the realm export file:

1. Edit: `docker/keycloak/realm-export.json`
2. Find the `ecommerce-app` client section
3. Update `redirectUris` and `webOrigins`:
   ```json
   "redirectUris": [
     "http://localhost:3333/api/auth/callback",
     "http://localhost:3333/*"
   ],
   "webOrigins": [
     "http://localhost:3333"
   ]
   ```
4. Restart Keycloak:
   ```bash
   docker-compose restart keycloak
   ```

## Solution 4: Use Keycloak Admin CLI

Access Keycloak container and use admin CLI:

```bash
# Access Keycloak container
docker exec -it b2b-ecommerce-keycloak /bin/bash

# Use Keycloak admin CLI
/opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin

# Update client
/opt/keycloak/bin/kcadm.sh update clients/ecommerce-app-id \
  --realm b2b-ecommerce \
  -s "redirectUris=[\"http://localhost:3333/api/auth/callback\",\"http://localhost:3333/*\"]" \
  -s "webOrigins=[\"http://localhost:3333\"]"
```

## Solution 5: Check Browser Console

Open browser Developer Tools (`F12`) and check:

1. **Console tab** - Look for JavaScript errors
2. **Network tab** - Look for failed requests (404, 500, etc.)
3. **Check if static assets are loading** - Look for `.js` and `.css` files

Common issues:
- 404 errors for `/admin/.../resources/...` files
- CORS errors
- Network errors

## Solution 6: Try Different Browser/Incognito

Sometimes browser-specific issues cause this:

1. Try Firefox instead of Chrome (or vice versa)
2. Try incognito/private mode
3. Disable all browser extensions

## Solution 7: Reset Keycloak Data

If nothing works, you can reset Keycloak:

```bash
# Stop Keycloak
docker-compose stop keycloak

# Remove Keycloak volume (⚠️ This deletes all data)
docker volume rm ecom-app_keycloak_data

# Start Keycloak again
docker-compose up -d keycloak

# Wait for Keycloak to start (60-90 seconds)
docker-compose ps keycloak

# Access Admin Console
# http://localhost:8080/admin
# Login: admin / admin
```

## Quick Configuration Without Admin Console

Since the Admin Console is stuck, here's a script to configure the client via REST API:

```bash
#!/bin/bash

# Get admin token
TOKEN=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" | jq -r '.access_token')

# Get client UUID
CLIENT_UUID=$(curl -s -X GET "http://localhost:8080/admin/realms/b2b-ecommerce/clients?clientId=ecommerce-app" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')

# Update client
curl -X PUT "http://localhost:8080/admin/realms/b2b-ecommerce/clients/$CLIENT_UUID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "redirectUris": ["http://localhost:3333/api/auth/callback", "http://localhost:3333/*"],
    "webOrigins": ["http://localhost:3333"]
  }'

echo "Client configuration updated!"
```

## Next Steps

1. **Try Solution 1 first** - Direct console URL
2. **If that doesn't work, try Solution 3** - Edit realm export file (easiest)
3. **If you need dynamic configuration, use Solution 2** - REST API

The realm export file is already configured correctly, so the redirect should work even if you can't access the Admin Console.

