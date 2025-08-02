/**
 * @file 003_add_default_user.sql
 * @description Creates a default user to satisfy foreign key constraints
 * This migration adds a system default user that can be used for prompts
 * when no specific user is available.
 */

-- Up Migration
INSERT INTO users (id, email, hashed_password, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'system@sflpromptarchitect.local',
    '$2b$10$defaulthashedpasswordfordefaultuser',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Down Migration  
DELETE FROM users WHERE id = '00000000-0000-0000-0000-000000000001';