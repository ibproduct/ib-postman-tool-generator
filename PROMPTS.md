# Prompt Templates for IntelligenceBank API MCP Server

This guide provides structured prompt templates for interacting with the IntelligenceBank API MCP Server. Each template includes variables to customize and example usage.

## Environment Configuration

This server is configured to work exclusively with specific IntelligenceBank Postman collections:

- **prod** (default): IntelligenceBank Public API collection
- **staging**: IB API Staging collection

To switch environments, update the `IB_API_ENVIRONMENT` variable in the MCP settings file.

## Variables Legend

Variables in templates are denoted by `{variable_name}`. Available variables:

- `{request_id}`: The specific request ID within the collection (e.g., "req-123")
- `{search_term}`: Term to search for in the collection (e.g., "authentication", "user")
- `{type}`: Type of items to search for ("all", "folder", or "request")
- `{framework}`: AI framework to use ("openai", "mistral", "gemini", "anthropic", "langchain", "autogen")
- `{language}`: Programming language to use ("javascript", "typescript", "python")

## 1. Search Collection (ib_api_search_collection)

Search within the IntelligenceBank API collection for folders or requests by name.

### Base Template
```
Find {search_term} in the IntelligenceBank API.
```

### With Type Filter Template
```
Find {search_term} in the IntelligenceBank API, show only {type}.
```

### Examples
```
Find "authentication" in the IntelligenceBank API.
```

```
Find "user" in the IntelligenceBank API, show only request.
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

## 2. Get Collection Structure (ib_api_get_collection_structure)

Get the folder structure and request IDs for the IntelligenceBank API collection.

### Base Template
```
Show the structure of the IntelligenceBank API collection.
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

## 3. Get Request Details (ib_api_get_request_details)

Get detailed information about a specific request in the IntelligenceBank API collection.

### Base Template
```
Get details of request {request_id}.
```

### Example
```
Get details of request req-123.
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

## 4. List Response Examples (ib_api_list_response_examples)

List available response examples for a specific request.

### Base Template
```
List response examples for request {request_id}.
```

### Example
```
List response examples for request req-123.
```

Expected Response:
```json
{
  "requestId": "req-123",
  "requestName": "Login",
  "examples": [
    {
      "id": "example-123",
      "name": "200 OK - Successful Login",
      "code": 200,
      "status": "OK"
    }
  ]
}
```

## 5. Get Response Details (ib_api_get_response_details)

Get detailed information about a specific response example.

### Base Template
```
Get response details for request {request_id}, example {example_id}.
```

### Example
```
Get response details for request req-123, example example-123.
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
    "name": "Login"
  },
  "response": {
    "id": "example-123",
    "name": "200 OK - Successful Login",
    "code": 200,
    "status": "OK",
    "body": {
      "token": "example-token",
      "expires_in": 3600
    },
    "headers": [
      {
        "key": "Content-Type",
        "value": "application/json"
      }
    ]
  }
}
```

## 6. Create Action (ib_api_create_action)

Generate a code action from a Postman request in the IntelligenceBank API collection.

### Base Template
```
Create a {framework} action in {language} for request {request_id}.
```

### Examples
```
Create an openai action in typescript for request req-123.
```

```
Create a langchain action in javascript for request req-123.
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

### Working with Response Examples

1. List response examples for a request:
```
List response examples for request {request_id}.
```

2. Get specific example details:
```
Get response details for request {request_id}, example {example_id_from_step_1}.
```

### Finding and Using a Request

1. Get collection structure:
```
Show the structure of the IntelligenceBank API collection.
```

2. Search for specific requests:
```
Find "login" in the IntelligenceBank API.
```

3. Get request details:
```
Get details of request {request_id_from_step_2}.
```

4. Generate action:
```
Create an openai action in typescript for request {request_id_from_step_2}.
```

## Tips for Effective Prompting

1. Be specific about what you're looking for
2. Use the request ID from previous responses
3. Specify the framework and language when generating actions
4. Use the full path when referencing nested requests
5. Include type filters when searching to narrow down results

## Error Handling

If you encounter errors, try these prompts:

1. For invalid request ID:
```
Show the structure of the IntelligenceBank API collection to find the correct request ID.
```

2. For search with no results:
```
Show the structure of the IntelligenceBank API collection to see available requests.
```

3. For environment issues:
```
Check the IB_API_ENVIRONMENT setting in your MCP settings file.