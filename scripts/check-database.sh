#!/bin/bash

# Database Setup Verification Script
# This script helps new developers verify the PostgreSQL database setup

set -e

echo "🔍 Checking PostgreSQL Database Setup..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "success" ]; then
        echo -e "${GREEN}✅ $message${NC}"
    elif [ "$status" = "error" ]; then
        echo -e "${RED}❌ $message${NC}"
    elif [ "$status" = "warning" ]; then
        echo -e "${YELLOW}⚠️  $message${NC}"
    else
        echo -e "$message"
    fi
}

# Check if Docker containers are running
echo "Checking Docker containers..."
if docker-compose ps | grep -q "b2b-ecommerce-postgres.*Up"; then
    print_status "success" "PostgreSQL container is running"
else
    print_status "error" "PostgreSQL container is not running"
    echo "Run: docker-compose up -d postgres"
    exit 1
fi

# Check container health
if docker-compose ps | grep -q "healthy"; then
    print_status "success" "PostgreSQL container is healthy"
else
    print_status "warning" "PostgreSQL container health check pending"
fi

# Check if databases exist
echo ""
echo "Checking databases..."
if docker exec b2b-ecommerce-postgres psql -U ecommerce -lqt | cut -d \| -f 1 | grep -qw b2b_ecommerce; then
    print_status "success" "Database 'b2b_ecommerce' exists"
else
    print_status "error" "Database 'b2b_ecommerce' not found"
    exit 1
fi

if docker exec b2b-ecommerce-postgres psql -U ecommerce -lqt | cut -d \| -f 1 | grep -qw keycloak; then
    print_status "success" "Database 'keycloak' exists"
else
    print_status "error" "Database 'keycloak' not found"
    exit 1
fi

# Check PostgreSQL extensions
echo ""
echo "Checking PostgreSQL extensions..."
extensions=("uuid-ossp" "pg_trgm" "unaccent")
for ext in "${extensions[@]}"; do
    if docker exec b2b-ecommerce-postgres psql -U ecommerce -d b2b_ecommerce -t -c "SELECT 1 FROM pg_extension WHERE extname = '$ext'" | grep -q 1; then
        print_status "success" "Extension '$ext' is installed"
    else
        print_status "error" "Extension '$ext' is missing"
    fi
done

# Check user privileges
echo ""
echo "Checking user privileges..."
if docker exec b2b-ecommerce-postgres psql -U ecommerce -d b2b_ecommerce -c "SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin FROM pg_roles WHERE rolname = 'ecommerce';" | grep -q "ecommerce.*t.*t.*t.*t"; then
    print_status "success" "User 'ecommerce' has proper privileges"
else
    print_status "error" "User 'ecommerce' privileges are incorrect"
fi

# Test basic connectivity
echo ""
echo "Testing basic connectivity..."
if docker exec b2b-ecommerce-postgres psql -U ecommerce -d b2b_ecommerce -c "SELECT current_database(), current_user, version();" > /dev/null 2>&1; then
    print_status "success" "Database connectivity test passed"
else
    print_status "error" "Database connectivity test failed"
    exit 1
fi

# Show connection details
echo ""
echo "📋 Connection Details:"
echo "======================"
echo "Host: localhost"
echo "Port: 5432"
echo "Database: b2b_ecommerce"
echo "Username: ecommerce"
echo "Password: ecommerce_password"
echo ""
echo "🔗 Connection URL: postgresql://ecommerce:ecommerce_password@localhost:5432/b2b_ecommerce"

# Show connection examples
echo ""
echo "💡 Connection Examples:"
echo "======================="
echo "# Using psql directly:"
echo "docker exec -it b2b-ecommerce-postgres psql -U ecommerce -d b2b_ecommerce"
echo ""
echo "# Using environment variables:"
echo "export DATABASE_URL=postgresql://ecommerce:ecommerce_password@localhost:5432/b2b_ecommerce"
echo ""
echo "# Using npm/scripts:"
echo "npm run db:connect"

echo ""
print_status "success" "Database setup verification completed successfully!"
echo ""
echo "🚀 Next steps:"
echo "1. Run migrations: npm run migration:run"
echo "2. Start the application: npm run start:dev"
echo "3. Check API health: curl http://localhost:3000/health"
