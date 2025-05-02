# Updating an MCP Server

This guide explains how to update your installation of the IntelligenceBank API Documentation MCP server when the underlying code is updated.

## Update Process

Follow these steps to update your MCP server installation:

### 1. Pull the Latest Code

Navigate to your server directory and pull the latest code:

```bash
cd path/to/ib-api-doc
git pull origin main
```

### 2. Install Dependencies

Install any new dependencies that might have been added:

```bash
npm install
```

### 3. Rebuild the Server

Rebuild the server to incorporate the code changes:

```bash
npm run build
```

### 4. Update MCP Settings

Update your MCP settings file to reflect any new configuration options or changes:

```
~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json
```

For example, with the latest update you need to:
- Add the `IB_API_ENVIRONMENT` environment variable
- Update the `alwaysAllow` array with the new tool names
- Remove deprecated tools

Example updated configuration:

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
        "IB_API_ENVIRONMENT": "prod"  // Environment setting
      },
      "disabled": false,
      "alwaysAllow": [
        "ib_api_search_collection",
        "ib_api_get_collection_structure",
        "ib_api_get_request_details",
        "ib_api_create_action",
        "ib_api_list_response_examples"  // New response examples tool
      ]
    }
  }
}
```

### 5. Restart the Server

If the server is running, stop and restart it:

- **If running in terminal**: Stop with Ctrl+C and relaunch
- **If running as a background process**: Stop and restart the process
- **If integrated with VSCode/Cline**: Reload the VSCode/Cline window

### 6. Verify the Update

Verify that the update was successful:

```bash
npm run inspector
```

Check that:
- The correct version number is displayed
- The expected tools are available
- Any new configuration options are recognized
- Response example handling works as expected

## Troubleshooting Update Issues

### Dependency Errors

If you encounter dependency errors after updating:

```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Configuration Errors

If you see configuration errors after updating:

- Check the CONFIGURATION.md file for any updated requirements
- Ensure all required environment variables are set
- Verify that your MCP settings file has the correct format

### Tool Not Found Errors

If you see "Unknown tool" errors:

- Check that your `alwaysAllow` array contains the correct tool names
- Note that tool names may change between versions (e.g., the recent prefix change to "ib_api_")
- Ensure new tools like `ib_api_list_response_examples` are included

### Server Not Starting

If the server won't start after an update:

- Check console output for error messages
- Verify that the build completed successfully
- Ensure the path in your MCP settings `args` array is correct

## Breaking Changes in Recent Updates

### Version 0.2.1

- Added new `ib_api_list_response_examples` tool for listing response examples
- Modified `ib_api_get_request_details` behavior:
  - Response examples are no longer included by default
  - Added `includeResponses` parameter (defaults to false)
  - Added `responseId` parameter for selective response inclusion
- Updated tool schemas to reflect new response handling options
- Renamed server from "ib-postman-tool-generator" to "ib-api-doc"

### Version 0.2.0

- Collection IDs are now hardcoded (prod: 720164-8af8ff92-7e1e-4ebe-b39a-9789e98063db, staging: 720164-770480e5-494b-4b63-a6a7-c376624eba71)
- Added `IB_API_ENVIRONMENT` setting (prod/staging)
- Removed `list_collections` tool
- All tools renamed with "ib_api_" prefix
- CollectionID parameter no longer needed in tool calls

## Migration Notes

### Upgrading to 0.2.1

1. Update your MCP settings:
   - Rename server from "ib-postman-tool-generator" to "ib-api-doc"
   - Update installation paths to use new name
   - Include the new `ib_api_list_response_examples` tool
2. Review any code using `ib_api_get_request_details`:
   - Add `includeResponses: true` where response examples are needed
   - Consider using `ib_api_list_response_examples` first to get response IDs
   - Update any code that assumed responses were included by default
3. Test response example handling after the update:
   - Try listing available examples
   - Verify request details with and without responses
   - Test selective response inclusion