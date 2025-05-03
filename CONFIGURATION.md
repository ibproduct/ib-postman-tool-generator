# Configuration Guide

This document outlines all configuration options for the IntelligenceBank API Documentation MCP Server.

## Required Configuration

### 1. Postman API Key

**Required**: Yes  
**Environment Variable**: `POSTMAN_API_KEY`

The Postman API key is required for authenticating requests to the Postman API. To obtain an API key, use the shared IntelligenceBank Postman account on TPM, or ask product@ for assistance:

1. Log in to the IntelligenceBank Postman account.
2. Go to: https://www.postman.com/settings/me/api-keys
3. Click "Generate API Key"
4. Required scopes:
   - Collection read access
   - Workspace read access (if using workspace filtering)

### 2. Environment Selection

**Required**: No (defaults to "prod")  
**Environment Variable**: `IB_API_ENVIRONMENT`

This server is configured to work exclusively with specific IntelligenceBank Postman collections. The environment setting determines which collection is used:

- **prod** (default): Uses the IntelligenceBank Public API collection (`720164-8af8ff92-7e1e-4ebe-b39a-9789e98063db`)
- **staging**: Uses the IB API Staging collection (`720164-770480e5-494b-4b63-a6a7-c376624eba71`)

### 3. MCP Server Configuration

Location: `~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json`

```json
{
  "mcpServers": {
    "ib-api-doc": {
      "command": "node",
      "args": [
        "/Users/charly/Documents/Cline/MCP/ib-api-doc/build/index.js"
      ],
      "env": {
        "POSTMAN_API_KEY": "your-postman-api-key",
        "IB_API_ENVIRONMENT": "prod"
      },
      "disabled": false,
      "alwaysAllow": [
        "ib_api_get_request_details",
        "ib_api_create_action",
        "ib_api_search_collection",
        "ib_api_get_collection_structure",
        "ib_api_list_response_examples",
        "ib_api_get_response_details"
      ]
    }
  }
}
```

#### Configuration Fields

| Field | Required | Description |
|-------|----------|-------------|
| `command` | Yes | Command to execute the server (should be "node") |
| `args` | Yes | Array containing the path to the built server file |
| `env.POSTMAN_API_KEY` | Yes | Your Postman API key |
| `env.IB_API_ENVIRONMENT` | No | Environment to use (prod/staging, defaults to "prod") |
| `disabled` | No | Whether the server is disabled (default: false) |
| `alwaysAllow` | No | Array of tool names to allow without confirmation |

## Optional Configuration

### 1. Response Example Handling

The server provides a comprehensive workflow for handling response examples through three complementary tools:

1. `ib_api_list_response_examples`: Lists available response examples for a request
2. `ib_api_get_request_details`: Gets request details (responses not included)
3. `ib_api_get_response_details`: Gets detailed information about a specific response example

Typical workflow:
1. Use `ib_api_list_response_examples` to get available example IDs
2. Use `ib_api_get_response_details` to fetch specific example details

This separation helps manage response payload sizes while providing detailed access to examples when needed.

### 2. Rate Limiting

The server respects Postman's rate limits by default. No additional configuration is needed.

### 3. Logging

The server logs errors to stderr by default. You can capture these logs by redirecting stderr when running the server.

### 4. Development Mode

For development, you can run the server with automatic reloading:

```bash
npm run watch
```

### 5. Debugging

To inspect the server's capabilities:

```bash
npm run inspector
```

## Security Considerations

1. API Key Protection
   - Store your API key securely
   - Don't commit it to version control
   - Consider using environment variables or a secrets manager

2. Access Control
   - Use `alwaysAllow` judiciously
   - Consider which tools should require confirmation
   - Monitor API key usage in Postman dashboard

## Troubleshooting

Common configuration issues and solutions:

1. "POSTMAN_API_KEY environment variable is required"
   - Ensure the API key is properly set in the MCP settings file
   - Verify the API key is valid and has the required scopes

2. "Unknown tool" error
   - Check that the tool name is included in the `alwaysAllow` array
   - Verify the tool name matches exactly (all tools now start with "ib_api_")

3. Server not starting
   - Verify the path in `args` is correct
   - Ensure the server is built (`npm run build`)
   - Check file permissions

4. Invalid environment setting
   - Check that IB_API_ENVIRONMENT is set to either "prod" or "staging"
   - The server will default to "prod" if the setting is missing or invalid

5. Response example issues
    - Ensure both requestId and exampleId are valid when using `ib_api_get_response_details`
    - Use `ib_api_list_response_examples` first to get valid example IDs
    - Check that the example exists for the specified request

## Updating Configuration

To update the configuration:

1. Stop any running instances of the server
2. Edit the MCP settings file
3. Restart the server or reload the MCP configuration

Changes to the configuration take effect immediately after restarting the server.