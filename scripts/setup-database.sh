#!/bin/bash

# Database Setup Script
# This script automatically sets up the PostgreSQL database for the B2B E-Commerce Platform

set -e

echo "🚀 Setting up B2B E-Commerce Database..."
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
    elif [ "$status" = "info" ]; then
        echo -e "${BLUE}ℹ️  $message${NC}"
    else
        echo -e "$message"
    fi
}

# Check if Docker is running
print_status "info" "Checking Docker availability..."
if ! command -v docker &> /dev/null; then
    print_status "error" "Docker is not installed or not in PATH"
    exit 1
fi

if ! docker info &> /dev/null; then
    print_status "error" "Docker daemon is not running"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_status "error" "Docker Compose is not installed or not in PATH"
    exit 1
fi

print_status "success" "Docker is available"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_status "warning" ".env file not found, creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_status "success" "Created .env from .env.example"
        print_status "warning" "Please update .env file with your configuration before continuing"
        exit 1
    else
        print_status "error" "No .env or .env.example file found"
        exit 1
    fi
fi

# Start Docker services
print_status "info" "Starting Docker services..."
if command -v docker-compose &> /dev/null; then
    docker-compose up -d postgres keycloak rabbitmq minio
else
    docker compose up -d postgres keycloak rabbitmq minio
fi

# Wait for PostgreSQL to be ready
print_status "info" "Waiting for PostgreSQL to be ready..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if docker exec b2b-ecommerce-postgres pg_isready -U ecommerce &> /dev/null; then
        break
    fi
    attempt=$((attempt + 1))
    echo -n "."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    print_status "error" "PostgreSQL failed to start within expected time"
    exit 1
fi

echo ""
print_status "success" "PostgreSQL is ready"

# Run the check-database script to verify setup
print_status "info" "Verifying database setup..."
if bash scripts/check-database.sh; then
    print_status "success" "Database setup verification passed"
else
    print_status "warning" "Database setup verification had issues, but continuing..."
fi

# Display next steps
echo ""
echo "🎉 Database Setup Complete!"
echo "=========================="
print_status "info" "Your B2B E-Commerce database is now ready!"
echo ""
echo "📋 Database Information:"
echo "------------------------"
echo "Host: localhost"
echo "Port: 5432"
echo "Database: b2b_ecommerce"
echo "Username: ecommerce"
echo "Password: ecommerce_password"
echo ""
echo "Available Services:"
echo "-------------------"
echo "• PostgreSQL (localhost:5432)"
echo "• Keycloak (localhost:8080) - Identity Provider"
echo "• RabbitMQ (localhost:5672, 15672) - Message Broker"
echo "• MinIO (localhost:9000, 9001) - Object Storage"
echo ""

# Prompt to run migrations
read -p "Would you like to run database migrations now? (y/N): " run_migrations
if [[ $run_migrations =~ ^[Yy]$ ]]; then
    print_status "info" "Running database migrations..."
    if npm run migration:run; then
        print_status "success" "Migrations completed successfully"
    else
        print_status "error" "Migration failed. You can run them manually with: npm run migration:run"
    fi
else
    echo "You can run migrations later with: npm run migration:run"
fi

# Prompt to start the application
read -p "Would you like to start the application now? (y/N): " start_app
if [[ $start_app =~ ^[Yy]$ ]]; then
    print_status "info" "Starting the application..."
    npm run start:dev
else
    echo "You can start the application later with: npm run start:dev"
fi

echo ""
print_status "success" "Setup completed! Happy coding! 🚀"
