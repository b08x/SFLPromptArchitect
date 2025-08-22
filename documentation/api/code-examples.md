# SFL Prompt Studio API Code Examples

## Prompt Management

### Create a Prompt

#### cURL
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

#### Python (requests)
```python
import requests

url = "http://localhost:3000/api/prompts"
headers = {
    "X-Temp-Auth": "your_temp_token",
    "Content-Type": "application/json"
}
payload = {
    "goal": "Generate marketing copy",
    "tenor": "Professional", 
    "mode": "Creative",
    "fields": [
        {"name": "target_audience", "value": "Tech Professionals", "type": "string"}
    ]
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

#### JavaScript (Fetch)
```javascript
const url = 'http://localhost:3000/api/prompts';
const payload = {
    goal: "Generate marketing copy",
    tenor: "Professional",
    mode: "Creative",
    fields: [
        {name: "target_audience", value: "Tech Professionals", type: "string"}
    ]
};

fetch(url, {
    method: 'POST',
    headers: {
        'X-Temp-Auth': 'your_temp_token',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
})
.then(response => response.json())
.then(data => console.log(data));
```

## Workflow Management

### Create a Workflow

#### cURL
```bash
curl -X POST http://localhost:3000/api/workflows \
  -H "X-Temp-Auth: your_temp_token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Marketing Campaign Workflow",
    "tasks": [
        {"name": "Research", "agent": "research_agent"},
        {"name": "Draft Content", "agent": "content_agent", "dependencies": ["Research"]}
    ]
  }'
```

#### Python (requests)
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

## Provider Management

### Get Provider Status

#### cURL
```bash
curl -X GET http://localhost:3000/api/providers/status \
  -H "X-Temp-Auth: your_temp_token"
```

#### Python (requests)
```python
import requests

url = "http://localhost:3000/api/providers/status"
headers = {
    "X-Temp-Auth": "your_temp_token"
}

response = requests.get(url, headers=headers)
print(response.json())
```

## Gemini AI Services

### Generate SFL from Goal

#### cURL
```bash
curl -X POST http://localhost:3000/api/gemini/generate-sfl \
  -H "X-Temp-Auth: your_temp_token" \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Create an engaging social media marketing campaign"
  }'
```

#### Python (requests)
```python
import requests

url = "http://localhost:3000/api/gemini/generate-sfl"
headers = {
    "X-Temp-Auth": "your_temp_token",
    "Content-Type": "application/json"
}
payload = {
    "goal": "Create an engaging social media marketing campaign"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```