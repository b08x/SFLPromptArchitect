# SFL Prompt Architect

A sophisticated prompt engineering tool built on **Systemic Functional Linguistics (SFL)** principles to help you create, test, and manage AI prompts with precision and theoretical grounding.

## What is SFL Prompt Architect?

SFL Prompt Architect transforms the art of prompt engineering into a structured, linguistic science. By applying Systemic Functional Linguistics theory, it breaks down every prompt into three fundamental dimensions:

- **Field** (What's happening): The subject matter, domain, and task type
- **Tenor** (Who's involved): The AI persona, target audience, and interpersonal dynamics  
- **Mode** (How it's communicated): Output format, structure, and textual directives

This systematic approach ensures your prompts are not just functional, but optimally crafted for their intended purpose.

## Key Features

### 🏗️ **Structured Prompt Creation**

- Create prompts using the SFL framework with guided fields
- Choose from predefined options or customize your own
- Ensure consistency and completeness in prompt design

### 🧙‍♂️ **AI-Powered Prompt Wizard**

- Describe your goal in natural language
- Let Gemini AI generate a complete SFL-structured prompt
- Refine and customize the AI-generated suggestions

### 🧪 **Live Prompt Testing**

- Test prompts directly with Google Gemini API
- Support for dynamic variables using `{{variable}}` syntax
- View responses in real-time to iterate and improve

### 🔍 **Advanced Search & Organization**

- Filter by topic, task type, AI persona, and output format
- Full-text search across all prompt components
- Organize your prompt library efficiently

### 📁 **Export & Management**

- Export individual prompts as JSON files
- Persistent storage with localStorage
- Import/export functionality for sharing prompt libraries

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose (recommended)
- Google Gemini API key
- PostgreSQL (if not using Docker)

### Quick Start with Docker (Recommended)

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd sfl-prompt-architect
   ```

2. **Start all services with Docker**

   ```bash
   docker-compose up
   ```

   This starts:
   - Frontend (React) on http://localhost:80
   - Backend (Express.js) on http://localhost:4000
   - PostgreSQL database on port 5432
   - Redis cache on port 6379

### Manual Installation

1. **Clone and install dependencies**

   ```bash
   git clone <repository-url>
   cd sfl-prompt-architect
   npm install  # Install root dependencies
   cd frontend && npm install  # Install frontend dependencies
   cd ../backend && npm install  # Install backend dependencies
   ```

2. **Set up environment variables**

   **Frontend** (`.env.local`):
   ```bash
   cd frontend
   echo "VITE_GEMINI_API_KEY=your_api_key_here" > .env.local
   ```

   **Backend** (`.env`):
   ```bash
   cd backend
   cat > .env << EOF
   DATABASE_URL=postgresql://user:password@localhost:5432/sfl_prompt_architect
   REDIS_URL=redis://localhost:6379
   NODE_ENV=development
   PORT=4000
   EOF
   ```

3. **Set up the database**

   ```bash
   cd backend
   npm run migrate:up  # Run database migrations
   ```

4. **Start development servers**

   ```bash
   # Terminal 1 - Backend
   npm run dev:backend

   # Terminal 2 - Frontend  
   npm run dev:frontend
   ```

### Production Build

```bash
npm run build  # Builds both frontend and backend
```

### Documentation

Generate complete API documentation:

```bash
npm run docs  # Generates unified documentation
```

View the documentation by opening `docs/index.html` in your browser.

## Illustrative Use Cases

### 1. **Content Creator: Educational Explainer**

**Scenario**: Sarah creates educational content for her YouTube channel about science topics.

**SFL Breakdown**:

- **Field**: Astrophysics, Explanation task, Simple analogies needed
- **Tenor**: Friendly Teacher persona, Children (5-7 years) audience, Engaging tone
- **Mode**: Plain text, Analogy-first structure, Short paragraph (~50 words)

**Example Prompt Created**:

```shell
"Explain what a black hole is in simple terms that a 5-year-old can understand. Use an analogy that relates to everyday objects they know. Keep it engaging and wonder-filled."
```

**Use**: Sarah tests this prompt, gets: *"Imagine a super-duper vacuum cleaner in space that's so strong it can suck up everything, even light! That's kind of like a black hole."*

### 2. **Software Developer: Code Generation**

**Scenario**: Alex needs to generate Python functions for various algorithmic problems.

**SFL Breakdown**:

- **Field**: Programming, Code Generation, Python/Algorithms
- **Tenor**: Expert Coder persona, Software Developers audience, Concise/Technical tone
- **Mode**: Python Code format, Function definition structure, Include type hints

**Example Prompt Created**:

```shell
"Write a Python function called `{{function_name}}` that {{task_description}}. Include proper type hints, docstring, and handle edge cases. Make it production-ready."
```

**Use**: Alex creates templates with variables, then generates specific functions by filling in `{{function_name}}` and `{{task_description}}`.

### 3. **Business Analyst: Report Summarization**

**Scenario**: Maria needs to summarize complex market research reports for executive briefings.

**SFL Breakdown**:

- **Field**: Business Analysis, Summarization, Market Research
- **Tenor**: Neutral Reporter persona, Business Professionals audience, Objective tone
- **Mode**: Bullet Points format, Key findings structure, Executive summary length

**Example Prompt Created**:

```shell
"Summarize the following market research report for C-level executives. Focus on key findings, market trends, and actionable insights. Present as bullet points with clear categories: Market Size, Competition, Opportunities, Risks."
```

**Use**: Maria tests with sample reports, refines the prompt until it consistently produces executive-ready summaries.

### 4. **Creative Writer: Character Development**

**Scenario**: David writes fantasy novels and needs help developing consistent character personalities.

**SFL Breakdown**:

- **Field**: Creative Writing, Character Development, Fantasy genre
- **Tenor**: Creative Muse persona, Writers audience, Imaginative tone
- **Mode**: Detailed description format, Character profile structure, Multiple paragraphs

**Example Prompt Created**:

```shell
"Create a detailed character profile for a {{character_type}} in a fantasy setting. Include personality traits, backstory, motivations, fears, and how they speak. Make them feel authentic and three-dimensional with internal contradictions that create depth."
```

**Use**: David uses variables like `{{character_type}}` to generate profiles for different roles (warrior, mage, merchant), building a consistent world.

### 5. **Researcher: Literature Review**

**Scenario**: Dr. Chen conducts academic research and needs help analyzing research papers.

**SFL Breakdown**:

- **Field**: Academic Research, Analysis, Literature Review
- **Tenor**: Expert persona, Academic Researchers audience, Formal tone
- **Mode**: Structured report format, Critical analysis structure, Detailed analysis

**Example Prompt Created**:

```shell
"Analyze the following research paper and provide a critical review covering: methodology strengths/weaknesses, contribution to the field, limitations, and potential future research directions. Maintain academic rigor and cite specific examples from the text."
```

**Use**: Dr. Chen tests with various paper types, adjusts the prompt to ensure consistent analytical depth across different research domains.

### 6. **Marketing Professional: Campaign Brainstorming**

**Scenario**: Lisa needs fresh ideas for marketing campaigns across different demographics.

**SFL Breakdown**:

- **Field**: Marketing, Brainstorming, Campaign Development
- **Tenor**: Creative Muse persona, Business Professionals audience, Enthusiastic tone
- **Mode**: Bullet Points format, Campaign concept structure, Multiple ideas

**Example Prompt Created**:

```shell
"Generate 5 creative marketing campaign ideas for {{product_type}} targeting {{target_demographic}}. For each idea, include: core concept, key message, channel strategy, and what makes it unique. Think outside the box while staying brand-appropriate."
```

**Use**: Lisa creates template prompts with variables, then generates campaigns for different products and demographics, building a repository of tested concepts.

## Why SFL Matters for Prompt Engineering

Traditional prompt engineering often relies on trial and error. SFL Prompt Architect brings linguistic theory to bear on prompt design, ensuring:

1. **Completeness**: Every prompt addresses Field, Tenor, and Mode dimensions
2. **Consistency**: Structured approach leads to reliable results
3. **Optimization**: Understanding context helps craft more effective prompts
4. **Reusability**: Well-structured prompts can be adapted and reused
5. **Collaboration**: Shared framework enables team prompt development

## Technical Architecture

### Full-Stack Application
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + TypeScript + Winston logging
- **Database**: PostgreSQL 16 with pgvector extension for embeddings
- **Cache**: Redis 7 Alpine
- **Deployment**: Docker Compose with nginx proxy

### AI & Integration
- **AI Integration**: Google Gemini API integration
- **Vector Search**: pgvector for document similarity search
- **Workflow Engine**: Task-based workflow execution with dependency management

### Development & Documentation
- **Documentation**: Automated TypeDoc generation for frontend and backend
- **Type Safety**: Shared TypeScript interfaces between frontend/backend
- **API Design**: RESTful endpoints with consistent error handling
- **Testing**: Manual testing through UI and API endpoints

### Key Features
- **SFL Framework**: Three-dimensional prompt structure (Field, Tenor, Mode)
- **Variable Substitution**: `{{variable}}` syntax with regex replacement
- **Export/Import**: JSON format with metadata preservation
- **Workflow Management**: Complex task dependency resolution
- **Real-time Features**: Workflow status updates, prompt testing feedback

### Available Scripts
- `npm run docs` - Generate complete unified documentation
- `npm run dev:frontend` - Start frontend development server
- `npm run dev:backend` - Start backend development server  
- `npm run build` - Build both frontend and backend
- `docker-compose up` - Start all services with Docker

## Documentation System

SFL Prompt Architect includes a comprehensive automated documentation system that generates unified API documentation for both frontend and backend components.

### Features
- **Automated Generation**: Single command generates complete documentation
- **Unified Interface**: Professional main page with navigation to all sections
- **TypeDoc Integration**: Full TypeScript API documentation
- **Multiple Formats**: HTML for backend, Markdown for frontend
- **GitHub Pages Ready**: Includes `.nojekyll` and proper structure for deployment

### Usage
```bash
# Generate complete documentation
npm run docs

# Generate only (without combining)
npm run docs:generate

# Combine existing documentation
npm run docs:combine
```

### Documentation Structure
```
docs/
├── index.html              # Main documentation homepage
├── frontend/               # Frontend TypeDoc (Markdown)
│   ├── README.html        # Frontend overview
│   ├── types/             # TypeScript interfaces
│   └── components/        # Component documentation
├── backend/               # Backend TypeDoc (HTML)
│   ├── index.html         # Backend API overview
│   └── modules/           # API endpoint documentation
├── docs-summary.json      # Build metadata
└── .nojekyll             # GitHub Pages compatibility
```

### Accessing Documentation
- **Local**: Open `docs/index.html` in your browser
- **GitHub Pages**: Deploy the `docs/` folder to GitHub Pages
- **CI/CD**: Integrate `npm run docs` into your build pipeline

## Contributing

This tool is designed to evolve with the prompt engineering community. Contributions welcome for:

- New SFL categories and options
- Additional AI provider integrations
- Export format extensions
- UI/UX improvements

## License

[Add your license information here]

---

*Transform your AI interactions from guesswork to precision with SFL Prompt Architect.*
