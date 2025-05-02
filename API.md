# API Reference

This document provides detailed information about the MCP server's API endpoints and data structures.

## Environment Configuration

The server is configured to work exclusively with IntelligenceBank Postman collections. The collection used depends on the environment setting:

- **prod** (default): Uses the IntelligenceBank Public API collection (`720164-8af8ff92-7e1e-4ebe-b39a-9789e98063db`)
- **staging**: Uses the IB API Staging collection (`720164-770480e5-494b-4b63-a6a7-c376624eba71`)

The environment is configured in the MCP settings file via the `IB_API_ENVIRONMENT` environment variable.

## Tools

### 1. ib_api_search_collection

Search within the IntelligenceBank API collection for folders or requests by name.

**Input Schema:**
```typescript
interface SearchCollectionInput {
  query: string;                            // Search query
  type?: 'all' | 'folder' | 'request';      // Type filter (default: 'all')
}
```

**Output Schema:**
```typescript
interface SearchCollectionOutput {
  workspace: {
    id: string;
    name: string;
    type: string;
  };
  collection: {
    id: string;
    name: string;
  };
  results: Array<{
    type: 'folder' | 'request';
    id: string;
    name: string;
    path: string;
    method?: string;  // Only for requests
  }>;
}
```

### 2. ib_api_get_collection_structure

Get the folder structure and request IDs for the IntelligenceBank API collection.

**Input Schema:**
```typescript
interface GetCollectionStructureInput {
  // No parameters required - uses the collection determined by environment
}
```

**Output Schema:**
```typescript
interface GetCollectionStructureOutput {
  workspace: {
    id: string;
    name: string;
    type: string;
  };
  collection: {
    id: string;
    name: string;
  };
  structure: {
    folders: Array<{
      id: string;
      name: string;
      path: string;
      folders: Array<FolderStructure>;  // Recursive
      requests: Array<{
        id: string;
        name: string;
        method: string;
        path: string;
      }>;
    }>;
    requests: Array<{
      id: string;
      name: string;
      method: string;
      path: string;
    }>;
  };
}
```

### 3. ib_api_list_response_examples

List available response examples for a specific request.

**Input Schema:**
```typescript
interface ListResponseExamplesInput {
  requestId: string;     // Request ID
}
```

**Output Schema:**
```typescript
interface ListResponseExamplesOutput {
  requestId: string;
  requestName: string;
  examples: Array<{
    id: string;
    name: string;
    code: number;
    status: string;
  }>;
}
```

### 4. ib_api_get_request_details

Get detailed information about a specific request in the IntelligenceBank API collection.

**Input Schema:**
```typescript
interface GetRequestDetailsInput {
  requestId: string;     // Request ID
  includeResponses?: boolean;  // Whether to include response examples (default: false)
  responseId?: string;   // Optional: ID of a specific response example to include (requires includeResponses=true)
}
```

**Output Schema:**
```typescript
interface GetRequestDetailsOutput {
  workspace: {
    id: string;
    name: string;
    type: string;
  };
  collection: {
    id: string;
    name: string;
  };
  request: {
    id: string;
    name: string;
    method: string;
    url: string;
    description: string;
    headers: Array<{
      key: string;
      value: string;
      description?: string;
      type?: string;
    }>;
    body?: {
      mode: string;
      raw?: string;
      urlencoded?: Array<{
        key: string;
        value: string;
      }>;
    };
    responses?: Array<{
      id: string;
      name: string;
      originalRequest: {
        method: string;
        header: Array<{
          key: string;
          value: string;
          description?: string;
          type?: string;
        }>;
        url: {
          raw: string;
          host: string[];
          path: string[];
          query?: Array<{
            key: string;
            value: string;
          }>;
        };
      };
      status: string;
      code: number;
      _postman_previewlanguage: string;
      header: Array<{
        key: string;
        value: string;
        description?: string;
        type?: string;
      }>;
      body?: string;
      uid: string;
    }>;
  };
}
```

### 5. ib_api_create_action

Generate a code action from a Postman request in the IntelligenceBank API collection. Optionally integrates with AI frameworks if specified.

**Input Schema:**
```typescript
interface CreateActionInput {
  requestId: string;      // Request ID
  language: 'javascript' | 'typescript' | 'python';
  agentFramework?: 'openai' | 'mistral' | 'gemini' | 'anthropic' | 'langchain' | 'autogen';  // Optional AI framework integration
}
```

**Output Schema:**
```typescript
interface CreateActionOutput {
  workspace: {
    id: string;
    name: string;
    type: string;
  };
  collection: {
    id: string;
    name: string;
  };
  code: string;  // Generated action code
}
```

## Response Example Handling

The server provides flexible handling of response examples through two complementary tools:

1. `ib_api_list_response_examples`: Get a lightweight list of available response examples for a request
2. `ib_api_get_request_details`: Get request details with optional response example inclusion:
   - By default, no response examples are included
   - Set `includeResponses: true` to include all response examples
   - Set `includeResponses: true` and provide a `responseId` to include only a specific example

This approach allows for efficient retrieval of response examples while managing response payload size.

## Error Handling

All tools return errors in the following format:

```typescript
interface ErrorResponse {
  content: Array<{
    type: 'text';
    text: string;  // Error message
  }>;
  isError: true;
}
```

Common error types:
- `InvalidParams`: Missing or invalid parameters
- `MethodNotFound`: Unknown tool name
- `InternalError`: Server-side errors

## Rate Limiting

The server respects Postman's API rate limits:
- 60 requests per minute
- Retries with exponential backoff
- Rate limit information in response headers

## Security

- All requests require a valid Postman API key
- API keys should have minimum required scopes
- Workspace and collection access is limited by API key permissions