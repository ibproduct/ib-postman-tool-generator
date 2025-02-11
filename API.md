# API Reference

This document provides detailed information about the MCP server's API endpoints and data structures.

## Tools

### 1. list_collections

Lists all available Postman collections.

**Input Schema:**
```typescript
interface ListCollectionsInput {
  workspace?: string; // Optional workspace ID to filter collections
}
```

**Output Schema:**
```typescript
interface ListCollectionsOutput {
  collections: Array<{
    id: string;          // Collection ID
    name: string;        // Collection name
    updatedAt: string;   // Last update timestamp
    workspace: {
      id: string;        // Workspace ID
      name: string;      // Workspace name
      type: string;      // Workspace type (team, personal)
    };
  }>;
}
```

### 2. search_collection

Search within a collection for folders or requests by name.

**Input Schema:**
```typescript
interface SearchCollectionInput {
  collectionId: string;                      // Collection ID
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

### 3. get_collection_structure

Get the folder structure and request IDs for a collection.

**Input Schema:**
```typescript
interface GetCollectionStructureInput {
  collectionId: string;  // Collection ID
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

### 4. get_request_details

Get detailed information about a specific request.

**Input Schema:**
```typescript
interface GetRequestDetailsInput {
  collectionId: string;  // Collection ID
  requestId: string;     // Request ID
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
    }>;
    body?: {
      mode: string;
      raw?: string;
      urlencoded?: Array<{
        key: string;
        value: string;
      }>;
    };
    responses: Array<any>;
  };
}
```

### 5. create_action

Generate a code action from a Postman request. Optionally integrates with AI frameworks if specified.

**Input Schema:**
```typescript
interface CreateActionInput {
  collectionId: string;   // Collection ID
  requestId: string;      // Request ID
  language: 'javascript' | 'typescript';
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