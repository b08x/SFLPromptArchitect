# SFL Prompt Studio Backend API Documentation

## Overview

The SFL Prompt Studio Backend API provides a comprehensive set of endpoints for managing AI-driven prompts, workflows, and AI model interactions.

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Temporary authentication token (for development)

### Authentication
During development, use the temporary authentication middleware:
- Include `X-Temp-Auth` header in all requests
- Token is generated server-side for development purposes

## API Endpoints

### Prompt Management
- `POST /api/prompts`: Create a new SFL-structured prompt
- `GET /api/prompts`: List prompts (filtering supported)
- `GET /api/prompts/:id`: Retrieve specific prompt
- `PUT /api/prompts/:id`: Update a prompt
- `DELETE /api/prompts/:id`: Delete a prompt

### Workflow Management
- `POST /api/workflows`: Create a workflow
- `GET /api/workflows`: List workflows
- `POST /api/workflows/orchestrate`: Orchestrate a complex workflow
- `POST /api/workflows/execute`: Execute a specific workflow
- `GET /api/workflows/jobs/:jobId/status`: Check workflow job status

### AI Provider Management
- `GET /api/providers/status`: Get current AI provider statuses
- `GET /api/providers/available`: List available AI providers
- `POST /api/providers/validate`: Validate a specific provider

## Code Examples

### Create a Prompt (cURL)
```bash
curl -X POST http://localhost:3000/api/prompts \
  -H "X-Temp-Auth: your_temp_token" \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Generate marketing copy",
    "tenor": "Professional",
    "mode": "Creative",
    "fields": [
      {"name": "target_audience", "value": "Tech Professionals", "type": "string"}
    ]
  }'
```

### Create a Workflow (Python with requests)
```python
import requests

url = "http://localhost:3000/api/workflows"
headers = {
    "X-Temp-Auth": "your_temp_token",
    "Content-Type": "application/json"
}
payload = {
    "name": "Marketing Campaign Workflow",
    "tasks": [
        {"name": "Research", "agent": "research_agent"},
        {"name": "Draft Content", "agent": "content_agent", "dependencies": ["Research"]}
    ]
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

## Error Handling

The API uses standard HTTP status codes:
- 200: Successful request
- 201: Resource created
- 400: Bad request
- 404: Resource not found
- 500: Server error

Detailed error responses include:
- `error`: Error type
- `message`: Human-readable error description
- `details`: Optional additional error information

## Versioning

Current API Version: 1.0.0
- Endpoint prefixed with `/api`
- Semantic versioning followed

## Testing

Use the included Postman collection (`sfl-prompt-studio-collection.json`) for easy API testing and exploration.

## Contributing

Please refer to the project's contribution guidelines for details on submitting pull requests and reporting issues.