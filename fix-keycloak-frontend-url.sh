#!/bin/bash

# Fix Keycloak Frontend URL to include port 8080
# This fixes redirects to localhost without :8080

echo "=== Fixing Keycloak Frontend URL ==="
echo ""

# Get admin access token
echo "1. Getting admin access token..."
TOKEN=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" | jq -r '.access_token')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "❌ Failed to get access token. Is Keycloak running?"
  exit 1
fi

echo "✅ Got access token"

# Get current realm config
echo ""
echo "2. Getting current realm configuration..."
REALM_CONFIG=$(curl -s -X GET "http://localhost:8080/admin/realms/b2b-ecommerce" \
  -H "Authorization: Bearer $TOKEN")

# Check if realm exists
if echo "$REALM_CONFIG" | jq -e '.realm' > /dev/null 2>&1; then
  echo "✅ Realm exists"
else
  echo "❌ Realm 'b2b-ecommerce' not found"
  exit 1
fi

# Update realm with Frontend URL
echo ""
echo "3. Updating realm Frontend URL to http://localhost:8080..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "http://localhost:8080/admin/realms/b2b-ecommerce" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(echo "$REALM_CONFIG" | jq '.attributes.frontendUrl = "http://localhost:8080"')")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" == "204" ] || [ "$HTTP_CODE" == "200" ]; then
  echo "✅ Realm Frontend URL updated successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Test login at: http://localhost:3333/login"
  echo "2. After login, redirect should include :8080 port"
else
  echo "❌ Failed to update realm. HTTP Code: $HTTP_CODE"
  echo "Response: $(echo "$RESPONSE" | head -n-1)"
  exit 1
fi

