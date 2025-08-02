/**
 * @file This file contains the database migration to create the "models" table.
 *
 * @author Your Name
 *
 * @description
 * This migration adds a `models` table to the database. This table is intended to store
 * information about the different AI models that can be used within the application,
 * such as their name, a description, and whether they are currently active.
 *
 * The down migration simply drops the `models` table.
 */

-- Up Migration
CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Down Migration
DROP TABLE models;