/**
 * @file 002_seed_users.sql
 * @description Seed file to create default users for development
 * This creates a default user that can be used for development and testing
 * when authentication is not yet implemented.
 */

-- Insert default development user
INSERT INTO users (id, email, hashed_password, created_at, updated_at) 
VALUES (
    '79e06398-14dc-4d4c-b2b2-7611e742172c',
    'dev@example.com',
    '$2b$10$dummy.hash.for.development.purposes.only',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert additional test user if needed
INSERT INTO users (id, email, hashed_password, created_at, updated_at) 
VALUES (
    uuid_generate_v4(),
    'test@example.com', 
    '$2b$10$another.dummy.hash.for.testing.purposes.only',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;