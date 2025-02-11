# Configuration Guide

This document outlines all configuration options for the Postman Documentation MCP Server.

## Required Configuration

### 1. Postman API Key

**Required**: Yes  
**Environment Variable**: `POSTMAN_API_KEY`

The Postman API key is required for authenticating requests to the Postman API. To obtain an API key:

1. Log in to your Postman account
2. Go to: https://www.postman.com/settings/me/api-keys
3. Click "Generate API Key"
4. Required scopes:
   - Collection read access
   - Workspace read access (if using workspace filtering)

### 2. MCP Server Configuration

Location: `~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`

```json
{
  "mcpServers": {
    "ib-postman-tool-generator": {
      "command": "node",
      "args": [
        "/path/to/postman-docs-server/build/index.js"
      ],
      "env": {
        "POSTMAN_API_KEY": "your-postman-api-key"
      },
      "disabled": false,
      "alwaysAllow": [
        "list_collections",
        "search_collection",
        "get_collection_structure",
        "get_request_details",
        "create_action"
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
| `disabled` | No | Whether the server is disabled (default: false) |
| `alwaysAllow` | No | Array of tool names to allow without confirmation |

## Optional Configuration

### 1. Rate Limiting

The server respects Postman's rate limits by default. No additional configuration is needed.

### 2. Logging

The server logs errors to stderr by default. You can capture these logs by redirecting stderr when running the server.

### 3. Development Mode

For development, you can run the server with automatic reloading:

```bash
npm run watch
```

### 4. Debugging

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
   - Verify the tool name matches exactly

3. Server not starting
   - Verify the path in `args` is correct
   - Ensure the server is built (`npm run build`)
   - Check file permissions

## Updating Configuration

To update the configuration:

1. Stop any running instances of the server
2. Edit the MCP settings file
3. Restart the server or reload the MCP configuration

Changes to the configuration take effect immediately after restarting the server.