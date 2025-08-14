# **SFL Prompt Architect: Docker Deployment & Usage Manual**

## **1. Quick Start with Docker Compose**

The fastest way to deploy SFL Prompt Architect is using Docker Compose, which orchestrates all services in isolated containers.

### **1.1 Prerequisites**

- Docker Engine (v20.10+)
- Docker Compose (v2.0+)
- Google Gemini API key (for LLM integration)
- 4GB+ RAM recommended

### **1.2 Deployment Steps**

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-repo/sfl-prompt-architect.git
   cd sfl-prompt-architect
   ```

2. **Configure environment variables:**
   Create `.env` file in the project root:

   ```bash
   GEMINI_API_KEY=your_api_key_here
   POSTGRES_PASSWORD=securepassword
   REDIS_PASSWORD=redispass
   ```

3. **Build and start containers:**

   ```bash
   docker-compose up -d --build
   ```

   This will:
   - Build frontend/backend images
   - Initialize PostgreSQL database
   - Configure Redis cache
   - Set up nginx reverse proxy

4. **Verify deployment:**

   ```bash
   docker-compose ps
   ```

   Expected output:

   ```bash
   Name                  Command               State           Ports
   -------------------------------------------------------------------
   frontend    npm run dev                   Up      0.0.0.0:80->3000/tcp
   backend     npm run start                Up      0.0.0.0:4000->4000/tcp
   postgres    docker-entrypoint.sh postgres Up      0.0.0.0:5432->5432/tcp
   redis       docker-entrypoint.sh redis ... Up      0.0.0.0:6379->6379/tcp
   nginx       /docker-entrypoint.sh ngin... Up      0.0.0.0:8080->80/tcp
   ```

5. **Access the application:**
   Open `http://localhost:8080` in your browser

---

## **2. Docker Architecture Overview**

### **2.1 Service Containers**

| Container  | Base Image          | Ports          | Volume Mounts               | Purpose                          |
|------------|---------------------|----------------|-----------------------------|----------------------------------|
| frontend   | node:18-alpine      | 3000 (→80)     | ./frontend:/app             | React frontend                   |
| backend    | node:18-alpine      | 4000           | ./backend:/app              | Express API server              |
| postgres   | postgres:16-alpine  | 5432           | postgres_data:/var/lib/postgresql | Database storage          |
| redis      | redis:7-alpine      | 6379           | redis_data:/data            | Caching layer                   |
| nginx      | nginx:alpine        | 8080 (→80)     | ./nginx.conf:/etc/nginx/conf.d/default.conf | Reverse proxy |

### **2.2 Key Docker Features**

- **Multi-stage builds**: Optimized production images
- **Health checks**: Automatic container recovery
- **Resource limits**: Prevent any single service from monopolizing resources
- **Network isolation**: Secure inter-container communication
- **Volume persistence**: Data survives container restarts

---

## **3. Using SFL Prompt Architect**

### **3.1 Core Workflow**

1. **Define LLM Prompt Structure**:
   - Field (What): Subject matter and task type
   - Tenor (Who): LLM persona and audience
   - Mode (How): Output format and structure

2. **Develop with Assistance**:

   ```bash
   # Use the AI wizard to generate SFL-compliant prompts
   docker-compose exec backend npm run prompt-wizard
   ```

3. **Test Prompts**:

   ```bash
   # Test against live Gemini API
   curl -X POST http://localhost:4000/api/test-prompt \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Your {{variable}} prompt here", "variables": {"variable": "value"}}'
   ```

4. **Save & Organize**:
   - Tag prompts by use case (e.g., `code-generation`, `educational`)
   - Version control through Docker volumes

### **3.2 Practical Examples**

#### **Example 1: Code Generation Prompt**

**Field**: Python programming, algorithm implementation
**Tenor**: Senior Developer persona, technical audience
**Mode**: Code block with type hints

```json
{
  "field": {
    "domain": "programming",
    "task": "code_generation",
    "complexity": "advanced"
  },
  "tenor": {
    "persona": "senior_developer",
    "audience": "engineers",
    "tone": "technical"
  },
  "mode": {
    "format": "code_block",
    "structure": "function_with_docstring",
    "length": "unlimited"
  },
  "content": "Implement a {{algorithm}} algorithm in Python with {{data_structure}}. Include comprehensive docstring and type hints. Handle edge cases for {{edge_case}}."
}
```

#### **Example 2: Educational Explainer**

**Field**: Quantum physics, conceptual explanation
**Tenor**: Friendly professor, student audience
**Mode**: Short paragraphs with analogies

```json
{
  "field": {
    "domain": "physics",
    "task": "concept_explanation",
    "complexity": "beginner"
  },
  "tenor": {
    "persona": "professor",
    "audience": "high_school_students",
    "tone": "engaging"
  },
  "mode": {
    "format": "paragraphs",
    "structure": "analogy_first",
    "length": "150_words"
  },
  "content": "Explain quantum superposition using an everyday analogy. Relate it to {{common_object}} and describe how measurement affects the system."
}
```

---

## **4. Docker Management Commands**

### **4.1 Common Operations**

| Command                          | Purpose                                  |
|----------------------------------|------------------------------------------|
| `docker-compose up -d`           | Start all services in detached mode     |
| `docker-compose down`            | Stop and remove containers               |
| `docker-compose logs -f backend` | View backend logs in real-time           |
| `docker-compose exec backend bash` | Access backend container shell         |
| `docker-compose build --no-cache` | Rebuild images from scratch            |

### **4.2 Database Management**

```bash
# Access PostgreSQL console
docker-compose exec postgres psql -U postgres -d sfl_prompt_architect

# Backup database
docker-compose exec postgres pg_dump -U postgres sfl_prompt_architect > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U postgres sfl_prompt_architect
```

### **4.3 Updating the System**

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose pull  # If using pre-built images
docker-compose up -d --build
```

---

## **5. Advanced Configuration**

### **5.1 Customizing Docker Resources**

Edit `docker-compose.yml` to adjust resource allocation:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
    mem_reservation: 1G
```

### **5.2 Adding Environment Variables**

Create `.env` file in project root:

```bash
# API Configuration
GEMINI_API_KEY=your_key_here
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models

# Database
POSTGRES_USER=prompt_user
POSTGRES_DB=sfl_prompt_architect

# Security
SESSION_SECRET=your_strong_secret_here
JWT_SECRET=another_strong_secret
```

### **5.3 Persistent Storage**

Default volume mounts in `docker-compose.yml`:

```yaml
volumes:
  postgres_data:
  redis_data:
  frontend_node_modules:
```

To change storage location:

```yaml
volumes:
  postgres_data:
    driver: local
    driver_opts:
      type: none
      device: /path/to/your/data
      o: bind
```

---

## **6. Troubleshooting**

### **6.1 Common Issues**

| Symptom                          | Solution                                  |
|----------------------------------|------------------------------------------|
| Containers fail to start         | Check logs: `docker-compose logs`       |
| API connection refused           | Verify backend is running: `docker-compose ps` |
| Database connection errors       | Reset DB: `docker-compose down -v` then up |
| Slow performance                  | Increase resource limits in compose file |
| Port conflicts                    | Change ports in docker-compose.yml       |

### **6.2 Debugging LLM Prompts**

```bash
# Test prompt processing
docker-compose exec backend node scripts/test-prompt.js "Your {{test}} prompt" '{"test":"value"}'

# View Gemini API requests
docker-compose logs backend | grep "Gemini API"
```

### **6.3 Rebuilding Specific Services**

```bash
# Rebuild just the frontend
docker-compose build frontend
docker-compose up -d --no-deps frontend

# Rebuild just the backend
docker-compose build backend
docker-compose up -d --no-deps backend
```

---

## **7. Architecture Deep Dive**

### **7.1 Container Communication**

```shell
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│             │    │             │    │             │
│   Frontend  │──▶│    Nginx    │ ─▶│   Backend   │
│   (React)   │    │   (Proxy)   │    │  (Express)  │
│             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────┬───────┘
                                               │
                                               ▼
┌───────────────────────────────────────────────────┐
│               Service Dependencies                │
├───────────────┬───────────────┬───────────────────┤
│  PostgreSQL   │     Redis     │   Gemini API      │
│  (Data)       │   (Cache)     │   (LLM)           │
└───────────────┴───────────────┴───────────────────┘
```

### **7.2 Data Flow for LLM Prompts**

1. **Frontend** collects SFL-structured prompt input
2. **Nginx** routes request to backend service
3. **Backend** validates prompt structure
4. **Redis** caches frequent prompt templates
5. **PostgreSQL** stores prompt history and metadata
6. **Gemini API** processes the optimized prompt
7. **Response** flows back through the same path

### **7.3 Security Considerations**

- All inter-container traffic uses Docker's internal network
- API keys are injected as environment variables
- Database credentials are container-scoped
- Redis is password-protected
- Nginx handles SSL termination (configure in `nginx.conf`)

---

## **8. Scaling the Deployment**

### **8.1 Horizontal Scaling**

To scale the backend service:

```yaml
# In docker-compose.yml
services:
  backend:
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
```

Then update with:

```bash
docker-compose up -d --scale backend=3
```

### **8.2 Production Considerations**

For production environments:

1. Use Docker Swarm or Kubernetes
2. Configure proper logging drivers
3. Set up monitoring for all containers
4. Implement backup strategies for volumes
5. Configure proper health checks
6. Use secrets management for sensitive data

Example health check configuration:

```yaml
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s
```

---

## **9. Best Practices for LLM Prompt Engineering**

### **9.1 Structuring Effective Prompts**

1. **Field Clarity**:
   - Be specific about the domain and task
   - Example: Not "explain coding" but "explain Python decorators to intermediate developers"

2. **Tenor Precision**:
   - Define the LLM's role explicitly
   - Example: "Act as a senior DevOps engineer with 10 years of Kubernetes experience"

3. **Mode Specificity**:
   - Dictate exact output format
   - Example: "Return as a Markdown code block with syntax highlighting"

### **9.2 Using Variables Effectively**

```json
{
  "template": "Generate a {{language}} function that implements {{algorithm}}.
               The function should:
               - Use {{data_structure}}
               - Handle {{edge_case}}
               - Include {{documentation_type}}",
  "variables": {
    "language": "Python",
    "algorithm": "Dijkstra's",
    "data_structure": "priority queue",
    "edge_case": "negative weights",
    "documentation_type": "Google-style docstrings"
  }
}
```

### **9.3 Testing Methodology**

1. **Unit Testing**:
   - Test individual prompt components
   - Example: Verify variable substitution works

2. **Integration Testing**:
   - Test complete prompt flows
   - Example: Submit prompt → get formatted response

3. **Regression Testing**:
   - Maintain a library of known-good prompts
   - Example: Compare new responses against baseline

### **9.4 Version Control for Prompts**

```bash
# Export prompt library
docker-compose exec backend npm run export-prompts > prompts_$(date +%Y%m%d).json

# Import prompt library
cat prompts.json | docker-compose exec -T backend npm run import-prompts
```

---

## **10. Maintenance and Updates**

### **10.1 Checking for Updates**

```bash
# Pull latest images
docker-compose pull

# View available updates
docker-compose images
```

### **10.2 Upgrading Components**

1. Update base images in `docker-compose.yml`
2. Run database migrations:

   ```bash
   docker-compose exec backend npm run migrate:up
   ```

3. Clear cache if needed:

   ```bash
   docker-compose exec redis redis-cli FLUSHALL
   ```

### **10.3 Backup Procedure**

```bash
# Create backup directory
mkdir -p backups/$(date +%Y%m%d)

# Backup database
docker-compose exec postgres pg_dump -U postgres sfl_prompt_architect > backups/$(date +%Y%m%d)/db.sql

# Backup redis
docker-compose exec redis redis-cli SAVE
docker cp $(docker-compose ps -q redis):/data/dump.rdb backups/$(date +%Y%m%d)/redis.rdb

# Compress backups
tar -czvf backups/$(date +%Y%m%d).tar.gz backups/$(date +%Y%m%d)
```

---

## **11. Uninstallation**

To completely remove SFL Prompt Architect:

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: this deletes all data)
docker volume rm sfl-prompt-architect_postgres_data
docker volume rm sfl-prompt-architect_redis_data
docker volume rm sfl-prompt-architect_frontend_node_modules

# Remove images
docker rmi sfl-prompt-architect_frontend
docker rmi sfl-prompt-architect_backend
```
