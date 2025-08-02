# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Full-Stack Development

- **Start all services**: `docker-compose up` (backend on :4000, frontend on :80, PostgreSQL on :5432, Redis on :6379)
- **Development mode**: `docker-compose up` with live reloading enabled

### Frontend Development

- **Directory**: `frontend/`
- **Install dependencies**: `cd frontend && npm install`
- **Dev server**: `cd frontend && npm run dev` (Vite, typically localhost:5173)
- **Build**: `cd frontend && npm run build` (outputs to `dist/`)
- **Preview**: `cd frontend && npm run preview`
- **Package.json scripts**: Only `dev`, `build`, and `preview` available

### Backend Development

- **Directory**: `backend/`
- **Install dependencies**: `cd backend && npm install`
- **Dev server**: `cd backend && npm run dev` (nodemon with TypeScript)
- **Build**: `cd backend && npm run build` (TypeScript compilation to `dist/`)
- **Production**: `cd backend && npm start`

### Database Management

- **Run migrations**: `cd backend && npm run migrate:up`
- **Rollback migrations**: `cd backend && npm run migrate:down`
- **Manual migrate**: `cd backend && npm run migrate`
- **Seed data**: Located in `database/seeds/`

### Environment Setup

- **Frontend**: Create `.env.local` with `VITE_GEMINI_API_KEY` (note the VITE_ prefix)
- **Backend**: Create `.env` with database and service configurations
- **Docker**: Environment variables configured in `docker-compose.yml`

### Testing

- No automated test framework currently configured
- Manual testing through UI and API endpoints
- Database testing via migrations and seeds

## Architecture Overview

Full-stack SFL (Systemic Functional Linguistics) prompt engineering application with React frontend, Express.js backend, PostgreSQL database with pgvector extension, and Redis caching.

### System Architecture

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + TypeScript + Winston logging
- **Database**: PostgreSQL 16 with pgvector extension for embeddings
- **Cache**: Redis 7 Alpine
- **Deployment**: Docker Compose with nginx proxy
- **AI Integration**: Google Gemini API integration

### Backend Architecture (`backend/src/`)

- **Entry Point**: `index.ts` - Express server setup with middleware and routes
- **API Routes**: `api/routes.ts` - RESTful API endpoints
- **Controllers**: `api/controllers/` - Request handling logic (prompts, models, workflows)
- **Services**: `services/` - Business logic layer (promptService, modelService, workflowService)
- **Database**: `config/database.ts` - PostgreSQL connection configuration
- **Middleware**: `middleware/errorHandler.ts` - Centralized error handling
- **Types**: `types.ts` - Shared TypeScript interfaces for database entities

### Database Schema (`database/migrations/`)

- **Users**: Authentication and user management
- **Prompts**: SFL-structured prompts with JSONB metadata
- **Workflows**: Graph-based workflow definitions with JSONB data
- **Documents**: File storage with vector embeddings
- **Document Chunks**: Text chunks with pgvector embeddings for RAG

### Frontend Architecture (`frontend/`)

- **Core Components**:
  - `App.tsx` - Main application with state management and modal orchestration
  - `types.ts` - Frontend TypeScript interfaces (PromptSFL, Task, Workflow)
- **UI Components**: `components/` - Modular React components with consistent patterns
- **Services**:
  - `geminiService.ts` - AI API integration
  - `promptApiService.ts` - Backend API communication
  - `workflowEngine.ts` - Workflow execution engine
- **Advanced Features**: `components/lab/` - Prompt Lab with workflow management

### Key Architectural Patterns

- **API Design**: RESTful endpoints with consistent error handling
- **State Management**: React hooks with localStorage fallback, migrating to backend persistence
- **Type Safety**: Shared TypeScript interfaces between frontend/backend
- **Modal System**: Centralized modal state with `ModalType` enum
- **Workflow Engine**: Task-based workflow execution with dependency management
- **Vector Search**: pgvector integration for document similarity search

### SFL Framework Implementation

The application implements Systemic Functional Linguistics with three dimensions:

- **Field**: Content domain, task type, specifics, keywords
- **Tenor**: AI persona, audience, tone, interpersonal dynamics
- **Mode**: Output format, structure, length, textual directives

### Data Flow Patterns

1. **Prompt Management**: Frontend ↔ Backend API ↔ PostgreSQL storage
2. **AI Integration**: Frontend → Backend → Gemini API (for testing/generation)
3. **Workflow Execution**: Task dependency resolution with data store management
4. **Document Processing**: File upload → text extraction → embedding generation → vector storage
5. **Real-time Features**: Workflow status updates, prompt testing feedback

### Important Implementation Details

- **Database**: Uses UUID primary keys, JSONB for flexible metadata, pgvector for embeddings
- **API Integration**: Gemini 2.5 Flash model with configurable parameters
- **Error Handling**: Winston logging in backend, graceful UI fallbacks in frontend
- **Variable Substitution**: `{{variable}}` syntax with regex replacement
- **Export/Import**: JSON format with metadata preservation
- **Containerization**: Multi-service Docker setup with development/production configs

## Environment Variables

### Frontend (.env.local)

- `VITE_GEMINI_API_KEY` - Google Gemini API key (exposed to client via vite.config.ts)

### Backend (.env)

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string  
- `NODE_ENV` - Environment mode (development/production)
- `PORT` - Backend server port (default: 4000)

## Implementation Guidelines

- **Database Changes**: Always create migrations in `database/migrations/`
- **API Development**: Follow REST conventions, use TypeScript interfaces
- **Frontend Patterns**: Use existing component patterns, maintain modal architecture
- **State Management**: Prefer backend persistence over localStorage for new features
- **Type Safety**: Keep frontend/backend types synchronized
- **Error Handling**: Use Winston for backend logging, graceful UI fallbacks
- **Testing**: Test migrations up/down, verify API endpoints, validate UI workflows

## Key Development Notes

- **No linting/formatting**: No ESLint, Prettier, or other code quality tools configured
- **Frontend State**: Uses React hooks for state management with ModalType enum system
- **API Structure**: Controllers → Services → Database pattern in backend
- **Default User**: System uses default user ID `00000000-0000-0000-0000-000000000001` for prompts
- **Migration System**: Uses node-pg-migrate for database schema management
- **Vector Embeddings**: pgvector extension enabled for document similarity search (1536 dimensions)
- **Workflow System**: Complex task dependency resolution with JSON-based graph data storage
