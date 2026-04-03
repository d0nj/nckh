-- Create schemas for multi-tenant architecture
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS academic;
CREATE SCHEMA IF NOT EXISTS student;
CREATE SCHEMA IF NOT EXISTS certification;
CREATE SCHEMA IF NOT EXISTS finance;

-- Grant permissions
GRANT ALL ON SCHEMA auth TO thai_binh;
GRANT ALL ON SCHEMA academic TO thai_binh;
GRANT ALL ON SCHEMA student TO thai_binh;
GRANT ALL ON SCHEMA certification TO thai_binh;
GRANT ALL ON SCHEMA finance TO thai_binh;
