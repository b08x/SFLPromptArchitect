# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Environment Setup
- Create `.env.local` file and set `GEMINI_API_KEY` environment variable
- Install dependencies: `npm install`

### Development
- Start development server: `npm run dev` (runs on default Vite port, typically http://localhost:5173)
- Build application: `npm run build` (outputs to `dist/`)
- Preview production build: `npm run preview`

### Testing
- No automated test framework is currently configured
- Manual testing is done via the Gemini API integration in the UI
- Test prompts directly through the application interface

## Architecture Overview

This is a React/TypeScript application built with Vite that implements a Systemic Functional Linguistics (SFL) prompt architect tool for AI prompt engineering.

### Core Architecture
- **Frontend**: React 19 with TypeScript, styled with Tailwind CSS classes
- **Build Tool**: Vite with custom configuration for environment variables
- **AI Integration**: Google Gemini API via `@google/genai` package
- **State Management**: React useState/useEffect with localStorage persistence
- **Data Structure**: SFL-based prompt structure with Field, Tenor, and Mode components

### Key Components Structure
- `App.tsx` - Main application component with state management, modal orchestration, and data persistence
- `types.ts` - TypeScript interfaces for SFL prompt structure and application state
- `services/geminiService.ts` - Gemini API integration for prompt testing and automated SFL generation
- `components/` - Reusable UI components (modals, forms, lists, filters, icons)
- `constants.ts` - Application constants and configuration
- `vite.config.ts` - Custom Vite configuration for environment variables (`GEMINI_API_KEY` → `process.env.API_KEY`)
- `outputs/` - Directory for exported prompt files (JSON format)

### SFL Prompt Structure
The application uses Systemic Functional Linguistics framework with three main components:
- **SFL Field**: What is happening (topic, task type, domain specifics, keywords)
- **SFL Tenor**: Who is taking part (AI persona, target audience, tone, interpersonal stance)
- **SFL Mode**: How it's communicated (output format, rhetorical structure, length, textual directives)

### Data Flow
1. **Persistence**: Prompts stored in browser localStorage, automatically synced with React state
2. **API Integration**: Gemini API (`gemini-2.5-flash-preview-04-17` model) for testing and SFL generation
3. **Modal System**: Centralized modal management via `ModalType` enum (create/edit/view/wizard)
4. **Filtering**: Real-time search across titles, content, and all SFL components
5. **Variable Substitution**: Dynamic `{{variable}}` replacement in prompt text during testing
6. **Export**: Individual prompt export as JSON files with sanitized filenames

### Important Implementation Details
- **State Management**: Single source of truth in `App.tsx` with localStorage persistence
- **Sample Data**: Application includes sample prompts for initial setup
- **Error Handling**: Graceful fallbacks for API failures and malformed localStorage data
- **Variable Pattern**: Uses `{{variable}}` syntax with regex replacement during prompt testing
- **Modal Architecture**: Single modal state with type-based rendering (no multiple modal instances)
- **Export Format**: Excludes runtime state (`isTesting`, `geminiResponse`, `geminiTestError`) from exports

## Environment Variables
- `GEMINI_API_KEY` - Required for Gemini API integration (set in `.env.local`)
- Accessed via `process.env.API_KEY` in the application (mapped in vite.config.ts)

## Implementation Guidelines
- Use agents when implementing changes