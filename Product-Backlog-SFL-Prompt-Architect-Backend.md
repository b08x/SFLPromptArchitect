
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
