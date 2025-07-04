# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Environment Setup
- Copy `.env.local` and set `GEMINI_API_KEY` environment variable
- Install dependencies: `npm install`

### Development
- Start development server: `npm run dev`
- Build application: `npm run build`
- Preview production build: `npm run preview`

### Testing
- No automated test framework is currently configured
- Manual testing is done via the Gemini API integration in the UI

## Architecture Overview

This is a React/TypeScript application built with Vite that implements a Systemic Functional Linguistics (SFL) prompt architect tool for AI prompt engineering.

### Core Architecture
- **Frontend**: React 19 with TypeScript, styled with Tailwind CSS classes
- **Build Tool**: Vite with custom configuration for environment variables
- **AI Integration**: Google Gemini API via `@google/genai` package
- **State Management**: React useState/useEffect with localStorage persistence
- **Data Structure**: SFL-based prompt structure with Field, Tenor, and Mode components

### Key Components Structure
- `App.tsx` - Main application component with state management and modal orchestration
- `types.ts` - TypeScript interfaces for SFL prompt structure and application state
- `services/geminiService.ts` - Gemini API integration for prompt testing and SFL generation
- `components/` - Reusable UI components including modals, forms, and lists
- `constants.ts` - Application constants and configuration

### SFL Prompt Structure
The application uses Systemic Functional Linguistics framework with three main components:
- **SFL Field**: What is happening (topic, task type, domain specifics, keywords)
- **SFL Tenor**: Who is taking part (AI persona, target audience, tone, interpersonal stance)
- **SFL Mode**: How it's communicated (output format, rhetorical structure, length, textual directives)

### Data Flow
1. Prompts are stored in localStorage and managed through React state
2. Gemini API is used for prompt testing and automated SFL generation
3. Modal system manages create/edit/view/wizard workflows
4. Filtering and search functionality operates on the prompt collection

### Key Features
- Prompt creation with SFL structure
- AI-powered prompt wizard using Gemini
- Prompt testing with live Gemini API responses
- Export functionality for individual prompts
- Advanced filtering and search capabilities
- Variable substitution in prompts ({{variable}} syntax)

## Environment Variables
- `GEMINI_API_KEY` - Required for Gemini API integration (set in `.env.local`)
- Accessed via `process.env.API_KEY` in the application (mapped in vite.config.ts)