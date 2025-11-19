@echo off
REM Database Setup Verification Script for Windows
REM This script helps new developers verify the PostgreSQL database setup

echo 🔍 Checking PostgreSQL Database Setup...
echo ========================================

REM Check if Docker containers are running
echo Checking Docker containers...
docker-compose ps | findstr "b2b-ecommerce-postgres.*Up" >nul
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL container is running
) else (
    echo ❌ PostgreSQL container is not running
    echo Run: docker-compose up -d postgres
    exit /b 1
)

REM Check container health
docker-compose ps | findstr "healthy" >nul
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL container is healthy
) else (
    echo ⚠️  PostgreSQL container health check pending
)

echo.
echo Checking databases...

REM Check if b2b_ecommerce database exists
docker exec b2b-ecommerce-postgres psql -U ecommerce -lqt | findstr /c:" b2b_ecommerce " >nul
if %errorlevel% equ 0 (
    echo ✅ Database 'b2b_ecommerce' exists
) else (
    echo ❌ Database 'b2b_ecommerce' not found
    exit /b 1
)

REM Check if keycloak database exists
docker exec b2b-ecommerce-postgres psql -U ecommerce -lqt | findstr /c:" keycloak " >nul
if %errorlevel% equ 0 (
    echo ✅ Database 'keycloak' exists
) else (
    echo ❌ Database 'keycloak' not found
    exit /b 1
)

echo.
echo Checking PostgreSQL extensions...

REM Check extensions
for %%e in (uuid-ossp pg_trgm unaccent) do (
    docker exec b2b-ecommerce-postgres psql -U ecommerce -d b2b_ecommerce -t -c "SELECT 1 FROM pg_extension WHERE extname = '%%e'" | findstr "1" >nul
    if %errorlevel% equ 0 (
        echo ✅ Extension '%%e' is installed
    ) else (
        echo ❌ Extension '%%e' is missing
    )
)

echo.
echo Checking user privileges...
docker exec b2b-ecommerce-postgres psql -U ecommerce -d b2b_ecommerce -c "SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin FROM pg_roles WHERE rolname = 'ecommerce';" | findstr "ecommerce.*t.*t.*t.*t" >nul
if %errorlevel% equ 0 (
    echo ✅ User 'ecommerce' has proper privileges
) else (
    echo ❌ User 'ecommerce' privileges are incorrect
)

echo.
echo Testing basic connectivity...
docker exec b2b-ecommerce-postgres psql -U ecommerce -d b2b_ecommerce -c "SELECT current_database(), current_user, version();" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Database connectivity test passed
) else (
    echo ❌ Database connectivity test failed
    exit /b 1
)

echo.
echo 📋 Connection Details:
echo ======================
echo Host: localhost
echo Port: 5432
echo Database: b2b_ecommerce
echo Username: ecommerce
echo Password: ecommerce_password
echo.
echo 🔗 Connection URL: postgresql://ecommerce:ecommerce_password@localhost:5432/b2b_ecommerce

echo.
echo 💡 Connection Examples:
echo =======================
echo # Using psql directly:
echo docker exec -it b2b-ecommerce-postgres psql -U ecommerce -d b2b_ecommerce
echo.
echo # Using environment variables:
echo set DATABASE_URL=postgresql://ecommerce:ecommerce_password@localhost:5432/b2b_ecommerce
echo.
echo # Using npm/scripts:
echo npm run db:connect

echo.
echo ✅ Database setup verification completed successfully!
echo.
echo 🚀 Next steps:
echo 1. Run migrations: npm run migration:run
echo 2. Start the application: npm run start:dev
echo 3. Check API health: curl http://localhost:3000/health
