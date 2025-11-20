@echo off
REM Database Setup Script for Windows
REM This script automatically sets up the PostgreSQL database for the B2B E-Commerce Platform

echo 🚀 Setting up B2B E-Commerce Database...
echo =======================================

REM Check if Docker is running
echo ℹ️  Checking Docker availability...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker daemon is not running
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo ✅ Docker is available

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  .env file not found, creating from .env.example...
    if exist ".env.example" (
        copy ".env.example" ".env"
        echo ✅ Created .env from .env.example
        echo ⚠️  Please update .env file with your configuration before continuing
        pause
        exit /b 1
    ) else (
        echo ❌ No .env or .env.example file found
        pause
        exit /b 1
    )
)

REM Start Docker services
echo ℹ️  Starting Docker services...
docker-compose up -d postgres keycloak rabbitmq minio
if %errorlevel% neq 0 (
    echo ❌ Failed to start Docker services
    pause
    exit /b 1
)

REM Wait for PostgreSQL to be ready
echo ℹ️  Waiting for PostgreSQL to be ready...
set /a attempts=0
:wait_loop
set /a attempts+=1
if %attempts% gtr 30 (
    echo ❌ PostgreSQL failed to start within expected time
    pause
    exit /b 1
)

docker exec b2b-ecommerce-postgres pg_isready -U ecommerce >nul 2>&1
if %errorlevel% neq 0 (
    echo Waiting... (%attempts%/30)
    timeout /t 2 >nul
    goto wait_loop
)

echo.
echo ✅ PostgreSQL is ready

REM Run the check-database script to verify setup
echo ℹ️  Verifying database setup...
call scripts\check-database.bat
if %errorlevel% neq 0 (
    echo ⚠️  Database setup verification had issues, but continuing...
)

echo.
echo 🎉 Database Setup Complete!
echo ==========================
echo ℹ️  Your B2B E-Commerce database is now ready!
echo.
echo 📋 Database Information:
echo ------------------------
echo Host: localhost
echo Port: 5432
echo Database: b2b_ecommerce
echo Username: ecommerce
echo Password: ecommerce_password
echo.
echo Available Services:
echo -------------------
echo • PostgreSQL (localhost:5432)
echo • Keycloak (localhost:8080) - Identity Provider
echo • RabbitMQ (localhost:5672, 15672) - Message Broker
echo • MinIO (localhost:9000, 9001) - Object Storage
echo.

set /p run_migrations="Would you like to run database migrations now? (y/N): "
if /i "%run_migrations%"=="y" (
    echo ℹ️  Running database migrations...
    npm run migration:run
    if %errorlevel% equ 0 (
        echo ✅ Migrations completed successfully
    ) else (
        echo ❌ Migration failed. You can run them manually with: npm run migration:run
    )
) else (
    echo You can run migrations later with: npm run migration:run
)

set /p start_app="Would you like to start the application now? (y/N): "
if /i "%start_app%"=="y" (
    echo ℹ️  Starting the application...
    npm run start:dev
) else (
    echo You can start the application later with: npm run start:dev
)

echo.
echo ✅ Setup completed! Happy coding! 🚀
pause
