-- Database initialization script for Docker
-- This script runs when the PostgreSQL container starts for the first time

-- Create the database if it doesn't exist
-- (This is handled by POSTGRES_DB environment variable)

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create a read-only user for reporting (optional)
-- CREATE USER crm_readonly WITH PASSWORD 'readonly_password';
-- GRANT CONNECT ON DATABASE crm_db TO crm_readonly;
-- GRANT USAGE ON SCHEMA public TO crm_readonly;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO crm_readonly;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO crm_readonly;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'CRM Database initialized successfully';
END $$;

