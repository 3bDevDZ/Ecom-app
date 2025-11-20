-- PostgreSQL Initialization Script for B2B E-Commerce Platform

-- Create Keycloak database if it doesn't exist
SELECT 'CREATE DATABASE keycloak'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'keycloak')\gexec

-- Enable required extensions for main database
\c b2b_ecommerce;

-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for full-text search capabilities
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable unaccent for text search normalization
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create schema for application tables
CREATE SCHEMA IF NOT EXISTS public;

-- Grant privileges
GRANT ALL PRIVILEGES ON SCHEMA public TO ecommerce;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ecommerce;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ecommerce;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO ecommerce;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO ecommerce;

-- Create basic database configuration
COMMENT ON DATABASE b2b_ecommerce IS 'B2B E-Commerce Platform - Main Database';

