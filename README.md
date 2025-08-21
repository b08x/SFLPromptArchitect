# SFL Prompt Studio

<div align="center">

**Transform AI prompt engineering from art to science with Systemic Functional Linguistics**

[![React](https://img.shields.io/badge/React-19.1.0-61dafb.svg?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg?style=flat&logo=node.js)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg?style=flat&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat)](#license)

</div>

## 🎯 What is SFL Prompt Studio?

SFL Prompt Studio revolutionizes prompt engineering by applying **Systemic Functional Linguistics** (SFL) theory to create structured, optimized AI prompts. Instead of trial-and-error approaches, it provides a systematic framework that breaks down every prompt into three fundamental dimensions:

- **🏗️ Field** (What's happening): Subject matter, domain, task type, and keywords
- **👥 Tenor** (Who's involved): AI persona, target audience, tone, and interpersonal dynamics  
- **📝 Mode** (How it's communicated): Output format, structure, length, and textual directives

This linguistic approach ensures your prompts are not just functional, but **optimally crafted** for their intended purpose.

## ✨ Key Features

### 🤖 **Multi-Provider AI Integration** ✨ *NEW!*

Universal AI provider support with seamless switching between:

- **🔵 Google Gemini**: Advanced reasoning and multimodal capabilities
- **🟢 OpenAI GPT**: Industry-leading language models (GPT-4o, GPT-4o-mini, o1)
- **🔗 OpenRouter**: Access to 100+ models from multiple providers
- **🛠️ Custom Endpoints**: Support for self-hosted and enterprise AI services

**Key Benefits:**
- 🚀 **One-Click Provider Switching**: Change AI providers instantly without reconfiguration
- 🔐 **Secure API Key Management**: Local storage with validation and testing
- 🎯 **Dynamic Model Discovery**: Automatically fetch available models for each provider
- ⚡ **Real-Time Validation**: Instant feedback on API key validity
- 💡 **Cost Optimization**: Choose the most cost-effective model for your use case

```typescript
// Unified interface across all providers
const providers = ['google', 'openai', 'openrouter'];
const models = await listModels(selectedProvider, apiKey);
const validation = await validateApiKey(provider, apiKey);
```

### 🏗️ **Structured Prompt Creation**

- Create prompts using the SFL framework with guided fields
- Choose from predefined options or customize your own
- Ensure consistency and completeness in prompt design
- Template system with `{{variable}}` support for dynamic content

### 🧙‍♂️ **AI-Powered Prompt Wizard**

- Describe your goal in natural language
- AI generates complete SFL-structured prompts automatically
- Refine and customize AI suggestions with iterative improvement
- Source document integration for stylistic reference

### 🧪 **Universal Prompt Testing**

- Test prompts with any configured AI provider
- Support for dynamic variables using `{{variable}}` syntax  
- Real-time response comparison across different models
- Response caching and history tracking

### 🔍 **Advanced Search & Organization**

- Filter by topic, task type, AI persona, and output format
- Full-text search across all prompt components
- Tag-based organization with popular tags
- Advanced filtering with multiple criteria

### 📁 **Import/Export & Management**

- Export individual prompts or entire libraries as JSON/Markdown
- Persistent storage with automatic backup
- Cross-platform sharing and collaboration
- Version history and change tracking

### 🪄 **AI Agent Orchestrator** ✨

Transform natural language descriptions into complete, executable workflows instantly! The Magic Wand feature uses advanced AI orchestration to automatically generate multi-step workflows with proper task dependencies and data flow.

```
🎯 User Input: "Analyze customer feedback for sentiment and generate a summary report"

     ↓ ✨ Magic Wand AI Orchestration ↓

📋 Generated Workflow:
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│   📥 Capture    │  😊 Analyze     │  📝 Extract     │  📊 Generate    │
│   Feedback      │  Sentiment      │  Themes         │  Report         │
│                 │                 │                 │                 │
│ • Get user text │ • Classify      │ • Find key      │ • Combine all   │
│ • Stage input   │   emotion       │   topics        │   analysis      │
│                 │ • Rate          │ • List main     │ • Format as     │
│                 │   confidence    │   points        │   report        │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 16+ and npm
- **Docker & Docker Compose** (recommended)
- **AI Provider API Keys** (Google Gemini, OpenAI, or OpenRouter)
- **PostgreSQL** (if not using Docker)

### 🐳 Quick Start with Docker (Recommended)

1. **Clone and Launch**
   ```bash
   git clone https://github.com/your-username/sfl-prompt-studio.git
   cd sfl-prompt-studio
   docker-compose up
   ```

2. **Access the Application**
   - Frontend: http://localhost:80
   - Backend API: http://localhost:4000
   - Database: PostgreSQL on port 5432

3. **Configure AI Providers**
   - Navigate to Settings → Provider Setup
   - Add your API keys for Google Gemini, OpenAI, or OpenRouter
   - Test and validate your configuration

### 🛠️ Manual Installation

1. **Install Dependencies**
   ```bash
   git clone https://github.com/your-username/sfl-prompt-studio.git
   cd sfl-prompt-studio
   
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend && npm install
   
   # Install backend dependencies
   cd ../backend && npm install
   ```

2. **Environment Configuration**
   
   **Frontend** (`.env.local`):
   ```bash
   cd frontend
   echo "VITE_API_BASE_URL=http://localhost:4000" > .env.local
   ```

   **Backend** (`.env`):
   ```bash
   cd backend
   cat > .env << EOF
   DATABASE_URL=postgresql://user:password@localhost:5432/sfl_prompt_studio
   REDIS_URL=redis://localhost:6379
   NODE_ENV=development
   PORT=4000
   GEMINI_API_KEY=your_gemini_api_key_here
   EOF
   ```

3. **Database Setup**
   ```bash
   cd backend
   npm run migrate:up
   npm run seed
   ```

4. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   npm run dev:backend
   
   # Terminal 2 - Frontend  
   npm run dev:frontend
   ```

## 🎨 Usage Examples

### 1. Multi-Provider Content Creation

```javascript
// Switch between providers for different tasks
const creativeTask = {
  provider: 'openai',
  model: 'gpt-4o',
  prompt: 'Write a creative story about...'
};

const analyticalTask = {
  provider: 'google', 
  model: 'gemini-1.5-pro',
  prompt: 'Analyze the following data...'
};

const economicTask = {
  provider: 'openrouter',
  model: 'anthropic/claude-3-sonnet',
  prompt: 'Provide cost-effective analysis...'
};
```

### 2. SFL-Structured Prompt Example

**Field (What):** Content Creation, Blog Writing, Technology Domain  
**Tenor (Who):** Expert Blogger → Tech Professionals, Informative Tone  
**Mode (How):** Markdown format, Tutorial structure, 800-1000 words  

**Generated Prompt:**
```
As an expert technology blogger, write a comprehensive tutorial about {{topic}} 
for software developers and tech professionals. Structure it with clear headings, 
code examples, and practical applications. Use an informative yet engaging tone. 
Format: Markdown, Length: 800-1000 words, Include: Introduction, Implementation 
steps, Best practices, Conclusion.
```

### 3. Provider Comparison Workflow

```typescript
// Test the same prompt across multiple providers
const promptText = "Explain quantum computing in simple terms";

const results = await Promise.all([
  testPrompt('google', 'gemini-1.5-flash', promptText),
  testPrompt('openai', 'gpt-4o-mini', promptText),
  testPrompt('openrouter', 'meta-llama/llama-3.1-8b', promptText)
]);

// Compare quality, cost, and response time
compareResults(results);
```

## 🏗️ Architecture

### Multi-Provider Integration
```
┌─────────────────────────────────────────────────────────────────┐
│                    SFL Prompt Studio                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🖥️ Frontend (React + TypeScript)                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Provider Setup │ Prompt Editor │ Testing Lab │ Library    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                │                                │
│                                ▼                                │
│  🔧 AI Service Layer (Direct HTTP Calls)                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ validateApiKey() │ listModels() │ Unified Interface        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                │                                │
│        ┌───────────────────────┼───────────────────────┐        │
│        ▼                       ▼                       ▼        │
│   🔵 Google Gemini        🟢 OpenAI API         🔗 OpenRouter   │
│   generativelanguage.     api.openai.com       openrouter.ai   │
│   googleapis.com                                               │
│                                                                 │
│  ⚙️ Backend (Node.js + Express)                                 │
│  ├─ PostgreSQL Database                                        │
│  ├─ Redis Cache                                                │
│  └─ Workflow Engine                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: React 19, TypeScript 5.8, Vite 6, Tailwind CSS 3.4
- **Backend**: Express.js, TypeScript, Winston logging, Bull Queue
- **Database**: PostgreSQL 16 with pgvector extension
- **Cache**: Redis 7 Alpine  
- **AI Integration**: Direct HTTP calls to provider APIs (no SDK dependencies)
- **Deployment**: Docker Compose with Nginx proxy

## 🪄 AI Agent Orchestration: From Idea to Execution

The Magic Wand feature revolutionizes workflow creation by transforming natural language descriptions into fully executable, multi-task workflows.

### 🎭 The Orchestration Process

```mermaid
graph TD
    A[🎯 Natural Language Input] --> B[🧠 AI Orchestrator]
    B --> C[📝 Task Decomposition]
    C --> D[🔗 Dependency Analysis]
    D --> E[📊 Data Flow Mapping]
    E --> F[⚡ Executable Workflow]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style F fill:#e8f5e8
```

### Example: Data Analysis Pipeline

**Input**: *"Process sales data to find trends and create a visualization"*

```
🏭 AI-Generated Workflow Architecture:

    📊 Raw Data        📈 Trend Analysis      📉 Visualization
   ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
   │ DATA_INPUT  │───▶│ GEMINI_PROMPT   │───▶│ DISPLAY_CHART   │
   │             │    │                 │    │                 │
   │ • Load CSV  │    │ • Analyze       │    │ • Generate      │
   │ • Validate  │    │   patterns      │    │   chart data    │
   │ • Clean     │    │ • Find trends   │    │ • Format for    │
   └─────────────┘    │ • Summarize     │    │   visualization │
                      └─────────────────┘    └─────────────────┘
```

### Orchestration Patterns

#### 🔀 **Sequential Pattern**
```
Input → Process → Transform → Output
  📥      🔄         🔧        📤
```

#### 🌟 **Fan-Out Pattern**  
```
        Input
         📥
         │
    ┌────┼────┐
    ▼    ▼    ▼
   🔄₁  🔄₂  🔄₃
    │    │    │
    └────┼────┘
         ▼
       Merge
        📤
```

## 📊 Provider Comparison

| Provider | Strengths | Use Cases | Cost | Speed |
|----------|-----------|-----------|------|-------|
| **Google Gemini** | Multimodal, Latest models | Research, Analysis | 💰💰 | ⚡⚡⚡ |
| **OpenAI GPT** | Reliability, Quality | Content, Coding | 💰💰💰 | ⚡⚡ |
| **OpenRouter** | Model Variety, Cost | Experimentation | 💰 | ⚡ |

## 🎯 Illustrative Use Cases

### Content Creator: Multi-Platform Strategy
```typescript
const contentStrategy = {
  // Use OpenAI for creative content
  creative: { provider: 'openai', model: 'gpt-4o' },
  
  // Use Gemini for research and analysis  
  research: { provider: 'google', model: 'gemini-1.5-pro' },
  
  // Use OpenRouter for cost-effective bulk content
  bulk: { provider: 'openrouter', model: 'mistral-7b' }
};
```

### Developer: Code Generation Across Languages
```typescript
const codeGeneration = {
  // Python data science - use Gemini
  python: { provider: 'google', model: 'gemini-1.5-flash' },
  
  // JavaScript/React - use OpenAI
  javascript: { provider: 'openai', model: 'gpt-4o-mini' },
  
  // Cost-sensitive scripting - use OpenRouter
  scripting: { provider: 'openrouter', model: 'codellama-34b' }
};
```

## 📚 Documentation

### Generate Complete Documentation
```bash
npm run docs  # Generates unified TypeDoc documentation
```

### Documentation Structure
```
docs/
├── index.html              # Main documentation homepage
├── frontend/               # Frontend component docs
├── backend/               # Backend API documentation  
└── .nojekyll             # GitHub Pages compatibility
```

## 🛠️ Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:frontend` | Start frontend development server |
| `npm run dev:backend` | Start backend development server |
| `npm run build` | Build both frontend and backend |
| `npm run docs` | Generate complete documentation |
| `docker-compose up` | Start all services with Docker |

### Testing Provider Integration

```typescript
// Test API key validation
const validation = await validateApiKey('google', 'your-api-key');
console.log(validation.success); // true/false

// List available models
const models = await listModels('openai', 'your-api-key');
console.log(models); // ['gpt-4o', 'gpt-4o-mini', ...]

// Test with custom endpoint
const customModels = await listModels('openai', 'key', { 
  baseURL: 'https://your-custom-endpoint.com' 
});
```

## 🔧 Configuration

### Environment Variables

**Frontend** (`.env.local`):
```bash
VITE_API_BASE_URL=http://localhost:4000
VITE_ENABLE_MULTI_PROVIDER=true
```

**Backend** (`.env`):
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/sfl_prompt_studio
REDIS_URL=redis://localhost:6379
NODE_ENV=development
PORT=4000

# Optional: Default API keys (users can override in UI)
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
OPENROUTER_API_KEY=your_openrouter_key
```

### Docker Configuration

```yaml
# docker-compose.yml
services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      - VITE_API_BASE_URL=http://localhost:4000
  
  backend:
    build: ./backend  
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/sfl_prompt_studio
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Areas for Contribution
- **New AI Providers**: Add support for additional AI services
- **SFL Categories**: Expand Field, Tenor, Mode options
- **Export Formats**: New import/export capabilities
- **UI/UX**: Interface improvements and accessibility
- **Documentation**: Examples, tutorials, and guides

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow the development setup above
4. Make your changes with proper TypeScript typing
5. Test with multiple AI providers
6. Submit a pull request

### Code Standards
- **TypeScript**: Strict typing required
- **ESLint**: Follow existing code style
- **Testing**: Include tests for new functionality
- **Documentation**: Update README and inline docs

## 📝 Why SFL Matters for Prompt Engineering

Traditional prompt engineering relies on trial and error. SFL Prompt Studio brings linguistic theory to create:

1. **🎯 Completeness**: Every prompt addresses Field, Tenor, and Mode
2. **🔄 Consistency**: Structured approach yields reliable results  
3. **⚡ Optimization**: Context understanding enables better prompts
4. **🔁 Reusability**: Well-structured prompts adapt across use cases
5. **👥 Collaboration**: Shared framework enables team development
6. **🤖 Provider Flexibility**: Same structured approach across all AI providers

## 🚀 Roadmap

### Version 0.6.0 - Enhanced Multi-Provider
- [ ] **Anthropic Claude Integration**: Direct API support
- [ ] **Azure OpenAI**: Enterprise-grade deployment support  
- [ ] **Custom Model Configuration**: Fine-tuned model support
- [ ] **Cost Tracking**: Usage monitoring across providers
- [ ] **Batch Processing**: Multi-provider bulk operations

### Version 0.7.0 - Advanced Features  
- [ ] **A/B Testing**: Compare prompts across providers
- [ ] **Performance Analytics**: Response quality metrics
- [ ] **Team Collaboration**: Shared prompt libraries
- [ ] **API Marketplace**: Community prompt sharing

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Systemic Functional Linguistics**: M.A.K. Halliday's foundational work
- **AI Community**: Open source AI tooling ecosystem
- **Contributors**: Everyone who helps improve this tool

---

<div align="center">

**Transform your AI interactions from guesswork to precision with SFL Prompt Studio** 🎯

[Get Started](#-getting-started) • [Documentation](#-documentation) • [Examples](#-illustrative-use-cases) • [Contributing](#-contributing)

</div>