#!/bin/bash

# Database Reset Script
# This script resets the PostgreSQL database (drops and recreates all data)

set -e

echo "⚠️  RESETTING B2B E-COMMERCE DATABASE"
echo "====================================="
echo "This will permanently delete all data in the database!"
echo ""

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

# Confirmation prompt
read -p "Are you sure you want to reset the database? Type 'RESET' to confirm: " confirmation
if [ "$confirmation" != "RESET" ]; then
    print_status "warning" "Database reset cancelled"
    exit 0
fi

# Check if containers are running
if ! docker ps | grep -q "b2b-ecommerce-postgres"; then
    print_status "error" "PostgreSQL container is not running"
    print_status "info" "Start the containers first with: npm run docker:up"
    exit 1
fi

print_status "info" "Starting database reset..."

# Drop and recreate databases
print_status "info" "Dropping existing databases..."
docker exec b2b-ecommerce-postgres psql -U ecommerce -c "DROP DATABASE IF EXISTS b2b_ecommerce;" 2>/dev/null || true
docker exec b2b-ecommerce-postgres psql -U ecommerce -c "DROP DATABASE IF EXISTS keycloak;" 2>/dev/null || true

print_status "info" "Recreating databases..."
docker exec b2b-ecommerce-postgres psql -U ecommerce -c "CREATE DATABASE b2b_ecommerce;"
docker exec b2b-ecommerce-postgres psql -U ecommerce -c "CREATE DATABASE keycloak;"

# Re-run initialization
print_status "info" "Running database initialization..."
docker exec b2b-ecommerce-postgres psql -U ecommerce -d b2b_ecommerce -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
docker exec b2b-ecommerce-postgres psql -U ecommerce -d b2b_ecommerce -c "CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";"
docker exec b2b-ecommerce-postgres psql -U ecommerce -d b2b_ecommerce -c "CREATE EXTENSION IF NOT EXISTS \"unaccent\";"

# Grant privileges
docker exec b2b-ecommerce-postgres psql -U ecommerce -d b2b_ecommerce -c "GRANT ALL PRIVILEGES ON SCHEMA public TO ecommerce;"
docker exec b2b-ecommerce-postgres psql -U ecommerce -d b2b_ecommerce -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ecommerce;"
docker exec b2b-ecommerce-postgres psql -U ecommerce -d b2b_ecommerce -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ecommerce;"

print_status "success" "Database reset completed"

# Prompt to run migrations
echo ""
read -p "Would you like to run migrations to recreate the schema? (y/N): " run_migrations
if [[ $run_migrations =~ ^[Yy]$ ]]; then
    print_status "info" "Running database migrations..."
    if npm run migration:run; then
        print_status "success" "Migrations completed successfully"
    else
        print_status "error" "Migration failed. You can run them manually with: npm run migration:run"
    fi
fi

echo ""
print_status "success" "Database reset completed! 🎉"
print_status "info" "The database is now clean and ready for fresh migrations."
