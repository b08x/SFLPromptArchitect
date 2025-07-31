/**
 * @file This file contains the initial database schema for the application.
 * It creates the necessary tables for users, prompts, workflows, and documents,
 * and also enables the "uuid-ossp" and "vector" extensions for PostgreSQL.
 *
 * @author Your Name
 *
 * @description
 * This migration sets up the following tables:
 * - `users`: Stores user information, including email and hashed password.
 * - `prompts`: Stores SFL prompts created by users.
 * - `workflows`: Stores user-defined workflows with their graph data.
 * - `documents`: Stores metadata about uploaded documents.
 * - `document_chunks`: Stores text chunks and their vector embeddings for uploaded documents.
 *
 * The "uuid-ossp" extension is used to generate UUIDs for primary keys.
 * The "vector" extension is used to store and query vector embeddings for semantic search.
 *
 * The down migration drops all the created tables and extensions in the reverse order of their creation.
 */

-- Up Migration
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    graph_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Down Migration
DROP TABLE document_chunks;
DROP TABLE documents;
DROP TABLE workflows;
DROP TABLE prompts;
DROP TABLE users;
DROP EXTENSION "vector";
DROP EXTENSION "uuid-ossp";