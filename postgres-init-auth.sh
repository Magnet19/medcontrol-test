#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "postgres" --no-password << EOSQL

-- Create reports user and database
CREATE USER reports WITH PASSWORD 'reports' SUPERUSER CREATEDB CREATEROLE;
CREATE DATABASE reports WITH OWNER reports;
GRANT ALL PRIVILEGES ON DATABASE reports TO reports;

EOSQL

# Connect to reports database
psql -v ON_ERROR_STOP=1 --username "postgres" --dbname "reports" << EOSQL

GRANT ALL PRIVILEGES ON SCHEMA public TO reports;
ALTER SCHEMA public OWNER TO reports;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO reports;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO reports;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO reports;

EOSQL

echo "Database initialization complete"
