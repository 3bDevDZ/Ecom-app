# Test Database Setup

The integration and E2E tests require a PostgreSQL database. Here are three options to set it up:

## Option 1: Docker (Recommended - Easiest)

If you have Docker installed:

```bash
# Start PostgreSQL test database
docker-compose -f docker-compose.test.yml up -d

# Verify it's running
docker ps

# Run all tests (including integration)
pnpm test

# Stop the database when done
docker-compose -f docker-compose.test.yml down
```

## Option 2: Install Docker Desktop

1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop
2. Install and start Docker Desktop
3. Use Option 1 above

## Option 3: Install PostgreSQL Directly (Windows)

### Using winget:
```powershell
# Run in PowerShell as Administrator
winget install --id PostgreSQL.PostgreSQL --accept-source-agreements --accept-package-agreements
```

### Manual Download:
1. Download from: https://www.postgresql.org/download/windows/
2. Install with default settings
3. Set password for postgres user to: `postgres`
4. Ensure it's running on port 5432

### Verify Installation:
```bash
# Check PostgreSQL is running
psql --version

# Test connection
psql -U postgres -h localhost
```

## Running Tests

### All tests (requires database):
```bash
pnpm test
```

### Unit tests only (no database required):
```bash
pnpm test test/unit
```

### Integration tests only (requires database):
```bash
pnpm test test/integration
```

### E2E tests only (requires database):
```bash
pnpm test test/e2e
```

## Current Test Status

✅ **Unit Tests**: 105/105 passing (no database required)
⏳ **Integration Tests**: 14 tests (requires PostgreSQL)
⏳ **E2E Tests**: Pending (requires PostgreSQL)

**Total**: 6 test suites, 119 tests
