# Prompt Templates for Postman Documentation MCP Server

This guide provides structured prompt templates for interacting with the Postman Documentation MCP Server. Each template includes variables to customize and example usage.

## Variables Legend

Variables in templates are denoted by `{variable_name}`. Available variables:

- `{collection_id}`: The Postman collection ID (e.g., "720164-8af8ff92-7e1e-4ebe-b39a-9789e98063db")
- `{workspace_id}`: The Postman workspace ID (e.g., "720164")
- `{request_id}`: The specific request ID within a collection (e.g., "req-123")
- `{search_term}`: Term to search for in collection (e.g., "authentication", "user")
- `{type}`: Type of items to search for ("all", "folder", or "request")
- `{framework}`: AI framework to use ("openai", "mistral", "gemini", "anthropic", "langchain", "autogen")
- `{language}`: Programming language to use ("javascript", "typescript")

## 1. List Collections

### Base Template
```
Show me all Postman collections.
```

### With Workspace Filter Template
```
Show me all Postman collections in workspace {workspace_id}.
```

### Example
```
Show me all Postman collections in workspace 720164.
```

Expected Response:
```json
{
  "collections": [
    {
      "id": "720164-8af8ff92-7e1e-4ebe-b39a-9789e98063db",
      "name": "IntelligenceBank Public API",
      "updatedAt": "2024-02-11T10:00:00Z",
      "workspace": {
        "id": "720164",
        "name": "IntelligenceBank",
        "type": "team"
      }
    }
  ]
}
```

## 2. Search Collection

### Base Template
```
Find {search_term} in collection {collection_id}.
```

### With Type Filter Template
```
Find {search_term} in collection {collection_id}, show only {type}.
```

### Examples
```
Find "authentication" in collection 720164-8af8ff92-7e1e-4ebe-b39a-9789e98063db.
```

```
Find "user" in collection 720164-8af8ff92-7e1e-4ebe-b39a-9789e98063db, show only request.
```

Expected Response:
```json
{
  "workspace": {
    "id": "720164",
    "name": "IntelligenceBank",
    "type": "team"
  },
  "collection": {
    "id": "720164-8af8ff92-7e1e-4ebe-b39a-9789e98063db",
    "name": "IntelligenceBank Public API"
  },
  "results": [
    {
      "type": "request",
      "id": "req-123",
      "name": "User Authentication",
      "path": "Auth / User Authentication",
      "method": "POST"
    }
  ]
}
```

## 3. Get Collection Structure

### Base Template
```
Show the structure of collection {collection_id}.
```

### Example
```
Show the structure of collection 720164-8af8ff92-7e1e-4ebe-b39a-9789e98063db.
```

Expected Response:
```json
{
  "workspace": {
    "id": "720164",
    "name": "IntelligenceBank",
    "type": "team"
  },
  "collection": {
    "id": "720164-8af8ff92-7e1e-4ebe-b39a-9789e98063db",
    "name": "IntelligenceBank Public API"
  },
  "structure": {
    "folders": [
      {
        "id": "folder-123",
        "name": "Authentication",
        "path": "Authentication",
        "requests": [
          {
            "id": "req-123",
            "name": "Login",
            "method": "POST",
            "path": "Authentication / Login"
          }
        ]
      }
    ]
  }
}
```

## 4. Get Request Details

### Base Template
```
Get details of request {request_id} from collection {collection_id}.
```

### Example
```
Get details of request req-123 from collection 720164-8af8ff92-7e1e-4ebe-b39a-9789e98063db.
```

Expected Response:
```json
{
  "workspace": {
    "id": "720164",
    "name": "IntelligenceBank",
    "type": "team"
  },
  "collection": {
    "id": "720164-8af8ff92-7e1e-4ebe-b39a-9789e98063db",
    "name": "IntelligenceBank Public API"
  },
  "request": {
    "id": "req-123",
    "name": "Login",
    "method": "POST",
    "url": "https://api.example.com/auth/login",
    "description": "Authenticate user and get access token",
    "headers": [
      {
        "key": "Content-Type",
        "value": "application/json"
      }
    ]
  }
}
```

## 5. Create Action

### Base Template
```
Create a {framework} action in {language} for request {request_id} from collection {collection_id}.
```

### Examples
```
Create an openai action in typescript for request req-123 from collection 720164-8af8ff92-7e1e-4ebe-b39a-9789e98063db.
```

```
Create a langchain action in javascript for request req-123 from collection 720164-8af8ff92-7e1e-4ebe-b39a-9789e98063db.
```

Expected Response:
```json
{
  "workspace": {
    "id": "720164",
    "name": "IntelligenceBank",
    "type": "team"
  },
  "collection": {
    "id": "720164-8af8ff92-7e1e-4ebe-b39a-9789e98063db",
    "name": "IntelligenceBank Public API"
  },
  "code": "import OpenAI from 'openai';\n\nexport async function loginUser(params: LoginParams) {\n  const url = 'https://api.example.com/auth/login';\n  // ... rest of the generated code\n}"
}
```

## Common Workflows

### Finding and Using a Request

1. List collections:
```
Show me all Postman collections.
```

2. Search for request:
```
Find "login" in collection {collection_id_from_step_1}.
```

3. Get request details:
```
Get details of request {request_id_from_step_2} from collection {collection_id_from_step_1}.
```

4. Generate action:
```
Create an openai action in typescript for request {request_id_from_step_2} from collection {collection_id_from_step_1}.
```

### Exploring Collection Structure

1. List collections:
```
Show me all Postman collections.
```

2. Get structure:
```
Show the structure of collection {collection_id_from_step_1}.
```

3. Get specific request details:
```
Get details of request {request_id_from_structure} from collection {collection_id_from_step_1}.
```

## Tips for Effective Prompting

1. Be specific about what you're looking for
2. Use the collection ID and request ID from previous responses
3. Specify the framework and language when generating actions
4. Use the full path when referencing nested requests
5. Include type filters when searching to narrow down results

## Error Handling

If you encounter errors, try these prompts:

1. For invalid collection ID:
```
Show me all Postman collections to get the correct ID.
```

2. For invalid request ID:
```
Show the structure of collection {collection_id} to find the correct request ID.
```

3. For search with no results:
```
Show the structure of collection {collection_id} to see available requests.