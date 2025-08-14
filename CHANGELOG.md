# CHANGELOG.md

## [0.5.1] - 2025-08-14

### 🚀 Features

- *(docs)* Implement automated TypeDoc documentation system
- Implement backlog tasks for system improvements and testing

### 🐛 Bug Fixes

- Resolve API-01 partial update bug in updateWorkflow

### 💼 Other

- Complete SEC-01 - remove client-side Gemini API key exposure
- Typedoc documentation
- Add compiled build artifacts for new TypeScript files

### ⚡ Performance

- Resolve PERF-01 N+1 query in workflow task execution

### ⚙️ Miscellaneous Tasks

- *(project)* Remove redundant database directory

## [0.5.0] - 2025-08-02

### 🚀 Features

- Add help modal with usage documentation
- Add Markdown export functionality for prompts and enhance source document handling
- Implement prompt CRUD API with database integration
- Integrate backend database with SFL prompt management
- *(workflow)* Add client-side ID generation for workflows
- *(lab)* Enhance Prompt Lab and Workflow Engine
- *(database)* Add initial schema, migrations, and complete backend build

### 🐛 Bug Fixes

- *(frontend)* Replace custom ID generation with crypto.randomUUID() in PromptFormModal
- *(backend)* Resolve API compatibility and database constraint issues
- *(backend)* Resolve migration system and Gemini JSON parsing issues

### 💼 Other

- Implementing epic 1

### 📚 Documentation

- *(codebase)* Add comprehensive JSDoc comments

### ⚙️ Miscellaneous Tasks

- Update TypeScript version and refactor Gemini service
- Ignore backend error log and remove redundant entries
