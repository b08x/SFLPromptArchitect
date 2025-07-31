### Product Backlog: SFL Prompt Architect Backend

This backlog outlines the necessary work to build a robust backend system using PostgreSQL and a vector store, and to refactor the frontend to communicate with it.

#### **Legend**

- **Epic:** A large body of work that can be broken down into smaller tasks.

- **Story/Task:** A specific, actionable item.

- **Complexity:** A t-shirt size estimate (S, M, L, XL) to gauge effort.

- **AC:** Acceptance Criteria.

---

### **Epic 1: Foundational Setup & Infrastructure (Complexity: M)**

Goal: Establish the project structure, development environment, and core dependencies needed for all subsequent work.

- **Task:** Initialize Node.js + Express + TypeScript Backend Project.

  - **Complexity:** S

  - **AC:** Project is set up with a tsconfig.json, basic Express server, and scripts for development and building.

- **Task:** Dockerize the Development Environment.

  - **Complexity:** M

  - **AC:** A docker-compose.yml file exists that can spin up the Node.js API server and a PostgreSQL database. The API server should successfully connect to the database.

- **Task:** Implement Database Migration System.

  - **Complexity:** S

  - **AC:** A migration tool (e.g., node-pg-migrate, knex) is configured. A command exists to run and revert migrations.

- **Task:** Implement Core Middleware (Logging & Error Handling).

  - **Complexity:** S

  - **AC:** A logger (e.g., Winston) is integrated. A global error-handling middleware is in place to catch unhandled errors and return a standardized JSON error response.

---

### **Epic 2: Prompt Management API (Complexity: L)**

Goal: Allow the application to create, read, update, and delete SFL prompts in the database.

- **Story:** As a user, I want to save a new prompt so that it is persisted for future use.

  - **Task:** Create prompts table migration. (S)

  - **Task:** Develop POST /api/prompts endpoint to create a new prompt. (M)

  - **AC:** The endpoint accepts a valid prompt JSON body, validates it, and saves it to the database, returning the created prompt with its new ID.

- **Story:** As a user, I want to view all my prompts so I can browse my library.

  - **Task:** Develop GET /api/prompts endpoint with filtering capabilities. (M)

  - **AC:** The endpoint returns an array of prompts. It supports query parameters for filtering by topic, taskType, aiPersona, etc.

- **Story:** As a user, I want to view, update, and delete a specific prompt.

  - **Task:** Develop GET /api/prompts/:id endpoint. (S)

  - **Task:** Develop PUT /api/prompts/:id endpoint. (S)

  - **Task:** Develop DELETE /api/prompts/:id endpoint. (S)

  - **AC:** Endpoints correctly retrieve, update, or delete the specified prompt by its ID.

- **Task:** Write Unit/Integration tests for all prompts endpoints.

  - **Complexity:** M

  - **AC:** Test coverage for all CRUD operations, including edge cases and validation failures.

---

### **Epic 3: Workflow Management API (Complexity: L)**

Goal: Enable the creation, storage, and modification of complex, multi-task workflows.

- **Story:** As a user, I want to save a new workflow so I can automate multi-step processes.

  - **Task:** Create workflows table migration. (S)

  - **Task:** Develop POST /api/workflows endpoint. (M)

  - **AC:** The endpoint validates the workflow structure, including its tasks, and saves it to the DB.

- **Story:** As a user, I want to manage my existing workflows.

  - **Task:** Develop GET /api/workflows endpoint. (S)

  - **Task:** Develop PUT /api/workflows/:id endpoint. (M)

  - **Task:** Develop DELETE /api/workflows/:id endpoint. (S)

  - **AC:** Full CRUD functionality is available for user-created workflows.

---

### **Epic 4: Model Management API (Complexity: S)**

Goal: Provide a way for the frontend to dynamically fetch available AI models.

- **Task:** Create and seed the models table.

  - **Complexity:** S

  - **AC:** A migration exists for the models table, and a seed script populates it with gemini-2.5-flash and imagen-3.0-generate-002.

- **Task:** Develop GET /api/models endpoint.

  - **Complexity:** S

  - **AC:** The endpoint returns a list of all active models from the database.

---

### **Epic 5: Document Ingestion & Vectorization (RAG) (Complexity: XL)**

Goal: Implement a complete pipeline for uploading documents, processing them into vectors, and making them searchable.

- **Task:** Design and create documents and document_chunks table schemas.

  - **Complexity:** M

  - **AC:** A migration creates the documents table (for file metadata) and a document_chunks table (with a vector column using pgvector).

- **Task:** Implement document upload endpoint.

  - **Complexity:** L

  - **AC:** A POST /api/documents/upload endpoint accepts a file, stores it (e.g., on a local disk for now, or cloud storage), and creates a corresponding entry in the documents table with status: 'pending'.

- **Task:** Set up an async background job queue.

  - **Complexity:** M

  - **AC:** A job queue (e.g., BullMQ) is integrated to handle long-running tasks without blocking the API.

- **Task:** Implement the 'Vectorization' background job.

  - **Complexity:** L

  - **AC:** The job picks up a 'pending' document, chunks its text, calls the Gemini Embedding API for each chunk, and stores the text and vector in the document_chunks table. It updates the document's status to completed or failed.

- **Task:** Create a semantic search endpoint.

  - **Complexity:** M

  - **AC:** A new POST /api/search endpoint accepts a query, converts it to a vector, and performs a cosine similarity search against the document_chunks table to return relevant text chunks.

---

### **Epic 6: Frontend Integration (Complexity: XL)**

Goal: Refactor the entire frontend application to use the new backend API instead of localStorage.

- **Story:** As a user, I want my prompts to persist, so I can access them from any device.

  - **Task:** Refactor App.tsx's useState for prompts to fetch from GET /api/prompts on load. (M)

  - **Task:** Refactor handleSavePrompt and handleDeletePrompt to call the POST/PUT/DELETE API endpoints. (L)

- **Story:** As a user, I want my custom workflows to persist.

  - **Task:** Refactor the useWorkflowManager hook to fetch and save custom workflows via the API. (M)

- **Story:** As a user, I want to securely test my prompts with Gemini.

  - **Task:** Create a new backend endpoint POST /api/gemini/test that takes a prompt and calls the Gemini API securely on the server. (M)

  - **Task:** Refactor handleTestWithGemini on the frontend to call this new backend endpoint. (S)

- **Task:** Implement loading skeletons and error state components in the UI.

  - **Complexity:** M

  - **AC:** All views that fetch data display a loading state (e.g., skeleton cards) and a user-friendly error message if an API call fails.

---

### Proposed Sprint Plan (High-Level)

- **Sprint 1:** Focus on **Epic 1**. Goal: A running, dockerized backend server with a database and migrations ready.

- **Sprint 2:** Focus on **Epic 2**. Goal: Full CRUD functionality for Prompts is available and tested on the backend.

- **Sprint 3:** Focus on **Epic 3 & 4**. Goal: Full CRUD for Workflows and a read-only endpoint for Models.

- **Sprint 4 & 5:** Focus on **Epic 6 (Part 1)**. Goal: Refactor the frontend's Prompt Library to be fully powered by the backend API.

- **Sprint 6 & 7:** Focus on **Epic 5**. Goal: The complete document upload and vectorization pipeline is functional.

- **Sprint 8:** Focus on **Epic 6 (Part 2)**. Goal: Integrate the Prompt Lab and new vector search capabilities into the UI.

This backlog provides a clear, organized path forward. We should start with the foundational setup and then build out the core features incrementally.

---

## **Backend Architecture & Infrastructure Plan**

This document outlines the comprehensive plan for the backend database, caching, and containerization strategy.

### **1. Database Design (PostgreSQL/Pgvector)**

The schema is designed to support the core features outlined in the backlog: prompt management, workflows, document ingestion for RAG, and user data.

#### **Key Tables and Schema**

*   **`users`**: Stores user information.
    *   `id` (UUID, PK): Primary Key.
    *   `email` (VARCHAR(255), UNIQUE, NOT NULL): User's email for login.
    *   `hashed_password` (TEXT, NOT NULL): Stored password hash.
    *   `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`).
    *   `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`).

*   **`prompts`**: Stores the core prompt templates.
    *   `id` (UUID, PK): Primary Key.
    *   `user_id` (UUID, FK -> `users.id`): The user who owns the prompt.
    *   `title` (VARCHAR(255), NOT NULL).
    *   `body` (TEXT, NOT NULL): The main content of the prompt.
    *   `metadata` (JSONB): For storing unstructured data like `temperature`, `model_id`, `taskType`, etc.
    *   `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`).
    *   `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`).

*   **`workflows`**: Stores multi-step prompt sequences.
    *   `id` (UUID, PK): Primary Key.
    *   `user_id` (UUID, FK -> `users.id`): The user who owns the workflow.
    *   `name` (VARCHAR(255), NOT NULL).
    *   `graph_data` (JSONB, NOT NULL): Stores the structure of the workflow, task connections, etc. (e.g., React Flow state).
    *   `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`).
    *   `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`).

*   **`documents`**: Tracks uploaded files for the RAG system.
    *   `id` (UUID, PK): Primary Key.
    *   `user_id` (UUID, FK -> `users.id`).
    *   `file_name` (TEXT, NOT NULL).
    *   `storage_path` (TEXT, NOT NULL): Path to the file in object storage (e.g., S3 bucket or local disk).
    *   `status` (VARCHAR(50), NOT NULL, DEFAULT `'pending'`): Processing status (e.g., `pending`, `processing`, `completed`, `failed`).
    *   `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`).

*   **`document_chunks`**: Stores the vectorized pieces of the uploaded documents.
    *   `id` (UUID, PK): Primary Key.
    *   `document_id` (UUID, FK -> `documents.id` ON DELETE CASCADE).
    *   `chunk_text` (TEXT, NOT NULL): The actual text chunk.
    *   `embedding` (**vector(1536)**, NOT NULL): The vector embedding from the text chunk. The dimension (e.g., 1536) depends on the embedding model used (e.g., OpenAI `text-embedding-ada-002`).
    *   `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT `now()`).

#### **Indexing Strategies**

*   **Relational Data**:
    *   Create B-tree indexes on all foreign key columns (`user_id`, `document_id`).
    *   Create an index on `users.email` for fast login lookups.
    *   Create a GIN index on `prompts.metadata` to allow for efficient querying of key-value pairs within the JSONB column (e.g., finding all prompts for a specific `taskType`).
*   **Vector Data (Pgvector)**:
    *   An **IVFFlat** index is recommended for a good balance of speed and recall on the `document_chunks.embedding` column.
    *   **SQL Example**: `CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);`
    *   The `lists` parameter is a tuning knob: higher values give better recall but are slower to build and query. It should be set based on the number of rows (e.g., `sqrt(number_of_rows)` is a common starting point).

#### **Scalability & Connection Pooling**

*   **Partitioning**: For now, partitioning is not required. If `document_chunks` grows into the billions, partitioning by `document_id` or a time range on `created_at` could be considered.
*   **Connection Pooling**: Use a dedicated connection pooler like **PgBouncer** in production. For development and within the Node.js application, a library like `pg-pool` (part of `node-postgres`) is sufficient.

### **2. Caching Strategy (Redis)**

*   **Data to Cache**:
    *   **User Sessions**: Store session tokens/data for authenticated users. (Redis `HASH`).
    *   **Frequently Accessed Prompts**: Cache individual prompts by their ID. (Redis `STRING`, storing JSON).
    *   **User Profiles**: Cache basic user data to avoid hitting the `users` table on every request. (Redis `HASH`).
    *   **API Rate Limiting**: Track request counts per user/IP. (Redis `STRING` with `INCR` and `EXPIRE`).

*   **Cache Invalidation**:
    *   **Cache-Aside (Lazy Loading)**: This will be the primary strategy. The application requests data from Redis first. If it's a miss, it queries PostgreSQL, stores the result in Redis with a Time-To-Live (TTL), and then returns it.
    *   **Write-Through Invalidation**: When a user updates or deletes a prompt (e.g., `PUT /api/prompts/:id`), the application must explicitly delete the corresponding key from Redis (`DEL prompt:id`). The cache will be repopulated on the next read.

*   **Redis Persistence & HA**:
    *   **Persistence**: Use **AOF (Append Only File)** every second. It offers better durability than RDB snapshots.
    *   **High Availability**: For production, **Redis Sentinel** should be configured to monitor Redis instances and handle automatic failover.

### **3. Integration and Data Flow**

1.  **Read Flow (e.g., `GET /api/prompts/:id`)**:
    *   App receives a request.
    *   It checks Redis for a key like `prompt:uuid`.
    *   **Cache Hit**: The cached JSON is returned directly.
    *   **Cache Miss**: The app queries PostgreSQL for the prompt. It then serializes the result to JSON, saves it to the Redis key with a TTL (e.g., 1 hour), and returns the data.
2.  **Write Flow (e.g., `PUT /api/prompts/:id`)**:
    *   App receives a request with updated data.
    *   It updates the record in the PostgreSQL `prompts` table.
    *   It issues a `DEL` command to Redis to invalidate the `prompt:uuid` key.
3.  **Vector Search Flow (`POST /api/search`)**: This flow bypasses the cache as searches are dynamic. The app generates an embedding for the search query and directly queries PostgreSQL using the cosine similarity operator (`<=>`) on the `document_chunks` table.

### **4. Operational Considerations**

*   **Backup and Recovery**:
    *   **PostgreSQL**: Use `pg_dump` for daily logical backups, stored in a secure cloud bucket (e.g., S3). For production, enable Point-in-Time Recovery (PITR) using continuous archiving of WAL files.
    *   **Redis**: Rely on AOF persistence. Back up the `appendonly.aof` file periodically.
*   **Monitoring**:
    *   **PostgreSQL**: Track query latency, index hit rate, connection count, and disk usage.
    *   **Redis**: Track memory usage, cache hit/miss ratio, connected clients, and command latency.
    *   Use a monitoring stack like **Prometheus + Grafana** with relevant exporters for Postgres and Redis.
*   **Security**:
    *   Enforce SSL/TLS for all database and cache connections.
    *   Use strong, rotated passwords managed via environment variables (or a secret manager like Vault).
    *   Configure network firewalls to only allow connections from the application server IP address.

### **5. Project Structure and Organization**

To accommodate the new backend, the project should be restructured into a monorepo-style layout.

```
/SFL-Prompt-Architect/
├── .gitignore
├── docker-compose.yml        # New: Orchestrates all services
├── README.md
│
├── backend/                  # New: Node.js + Express API
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── api/              # Express routes and controllers
│       ├── config/           # Database, Redis connections
│       ├── services/         # Business logic (prompt service, etc.)
│       ├── middleware/       # Error handling, auth
│       └── index.ts          # Server entry point
│
├── frontend/                 # Existing React App
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   └── (all other existing frontend files: App.tsx, components/, etc.)
│
└── database/                 # New: DB Migrations and Seeds
    ├── migrations/
    │   └── 001_initial_schema.sql
    └── seeds/
        └── 001_add_models.sql
```

**Rationale**:
*   **Separation of Concerns**: `frontend`, `backend`, and `database` are cleanly separated, each with its own dependencies and build process.
*   **Scalability**: Each component can be developed, tested, and deployed independently.
*   **Orchestration**: The root `docker-compose.yml` file acts as the single source of truth for defining and running the entire application stack locally.

### **6. Dockerization Plan**

#### **`docker-compose.yml`**

This file will define and link all services.

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: sfl-backend
    ports:
      - "4000:4000"
    volumes:
      - ./backend:/app # Mount for live-reloading in dev
      - /app/node_modules # Avoids overwriting container node_modules
    depends_on:
      - db
      - cache
    environment:
      - DATABASE_URL=postgres://user:password@db:5432/sfl_db
      - REDIS_URL=redis://cache:6379
      - NODE_ENV=development
    networks:
      - sfl-network

  frontend:
    build: ./frontend
    container_name: sfl-frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    networks:
      - sfl-network

  db:
    image: pgvector/pgvector:pg16 # Use an image with pgvector pre-installed
    container_name: sfl-db
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=sfl_db
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - sfl-network

  cache:
    image: redis:7-alpine
    container_name: sfl-cache
    ports:
      - "6379:6379"
    networks:
      - sfl-network

volumes:
  pgdata:

networks:
  sfl-network:
    driver: bridge
```

#### **`backend/Dockerfile` (Production-Ready)**

A multi-stage build for a lean production image.

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build # Compiles TypeScript to dist/

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
```

#### **`frontend/Dockerfile` (Production-Ready)**

This uses a multi-stage build to serve static files with Nginx.

```dockerfile
# Stage 1: Build the React app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Optional: Add a custom nginx.conf if you need to proxy API requests
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### **Build and Run Steps**

1.  **Restructure Project**: First, create the `frontend` and `backend` directories and move the respective files into them as described in section 5.
2.  **Create Dockerfiles**: Place the `Dockerfile` examples inside the `backend` and `frontend` directories.
3.  **Build Images**: From the project root, run:
    ```bash
    docker-compose build
    ```
    This command will build the images for the `frontend` and `backend` services.
4.  **Run Services**: To start all services in detached mode, run:
    ```bash
    docker-compose up -d
    ```
5.  **Access Services**:
    *   Frontend: `http://localhost:5173`
    *   Backend API: `http://localhost:4000`
    *   PostgreSQL: `localhost:5432`
    *   Redis: `localhost:6379`

#### **Development vs. Production**

*   **Development**: The provided `docker-compose.yml` is well-suited for development because the `volumes` mounts enable hot-reloading for both the frontend and backend.
*   **Production**: For a production deployment, you would remove the source code `volumes` to create immutable containers. You would build the images once (e.g., in a CI/CD pipeline) and push them to a container registry. The deployment would then pull these pre-built images. You would also manage secrets (`DATABASE_URL`, etc.) more securely using orchestration tools like Kubernetes Secrets or Docker Swarm Secrets.