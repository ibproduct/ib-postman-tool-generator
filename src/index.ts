#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

interface PostmanCollection {
  info: {
    name: string;
    description: string;
    schema: string;
  };
  item: PostmanItem[];
}

interface PostmanItem {
  id?: string;
  name: string;
  item?: PostmanItem[]; // For folders
  request?: {
    method: string;
    url: {
      raw: string;
      host: string[];
      path: string[];
    };
    description?: string;
    header?: any[];
    body?: {
      mode: string;
      raw?: string;
      urlencoded?: any[];
      formdata?: any[];
    };
  };
  response?: any[];
}

interface PostmanWorkspace {
  id: string;
  name: string;
  type: string;
  error?: string;
}

// Hardcoded collection IDs for IntelligenceBank APIs
const IB_COLLECTION_IDS = {
  prod: '720164-8af8ff92-7e1e-4ebe-b39a-9789e98063db',    // IntelligenceBank Public API
  staging: '720164-770480e5-494b-4b63-a6a7-c376624eba71'  // IB API Staging (Internal Use Only)
};

type Environment = 'prod' | 'staging';

class PostmanDocsServer {
  private server: Server;
  private axiosInstance;
  private API_KEY: string;
  private environment: Environment;

  constructor() {
    const apiKey = process.env.POSTMAN_API_KEY;
    if (!apiKey) {
      throw new Error('POSTMAN_API_KEY environment variable is required');
    }
    this.API_KEY = apiKey;
    
    // Default to 'prod' if not specified
    this.environment = (process.env.IB_API_ENVIRONMENT as Environment) || 'prod';
    console.log(`Using ${this.environment} environment with collection ID: ${this.getCollectionId()}`);

    this.server = new Server(
      {
        name: 'ib-postman-tool-generator',
        version: '0.2.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.axiosInstance = axios.create({
      baseURL: 'https://api.postman.com',
      headers: {
        'X-Api-Key': this.API_KEY,
      },
    });

    this.setupToolHandlers();
    
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private getCollectionId(): string {
    return IB_COLLECTION_IDS[this.environment];
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'ib_api_search_collection',
          description: 'Search within the IntelligenceBank API collection for folders or requests by name',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query to match against folder/request names',
              },
              type: {
                type: 'string',
                enum: ['all', 'folder', 'request'],
                description: 'Type of items to search for',
                default: 'all',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'ib_api_get_collection_structure',
          description: 'Get the folder structure and request IDs for the IntelligenceBank API collection',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'ib_api_get_request_details',
          description: 'Get detailed information about a specific request in the IntelligenceBank API collection',
          inputSchema: {
            type: 'object',
            properties: {
              requestId: {
                type: 'string',
                description: 'The request ID',
              },
            },
            required: ['requestId'],
          },
        },
        {
          name: 'ib_api_create_action',
          description: 'Generate an AI action from a Postman request in the IntelligenceBank API collection',
          inputSchema: {
            type: 'object',
            properties: {
              requestId: {
                type: 'string',
                description: 'The ID of the request to generate an action for',
              },
              language: {
                type: 'string',
                enum: ['javascript', 'typescript', 'python'],
                description: 'Programming language to use',
              },
              agentFramework: {
                type: 'string',
                enum: ['openai', 'mistral', 'gemini', 'anthropic', 'langchain', 'autogen'],
                description: 'AI agent framework to use',
              },
            },
            required: ['requestId', 'language'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'ib_api_search_collection':
          return this.handleSearchCollection({
            ...request.params.arguments,
            collectionId: this.getCollectionId()
          });
        case 'ib_api_get_collection_structure':
          return this.handleGetCollectionStructure({
            collectionId: this.getCollectionId()
          });
        case 'ib_api_get_request_details':
          return this.handleGetRequestDetails({
            ...request.params.arguments,
            collectionId: this.getCollectionId()
          });
        case 'ib_api_create_action':
          return this.handleCreateAction({
            ...request.params.arguments,
            collectionId: this.getCollectionId()
          });
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  private async getWorkspaceInfo(workspaceId: string): Promise<PostmanWorkspace | null> {
    try {
      // First try to list all workspaces
      const response = await this.axiosInstance.get('/workspaces');
      const workspaces = response.data?.workspaces;
      
      if (!workspaces) {
        throw new Error('No workspaces found in response');
      }

      // Find the workspace that contains our collection
      const workspace = workspaces.find((w: any) => {
        // Check if this workspace contains our collection ID
        return w.collections?.some((c: any) => c.id === workspaceId || c.uid?.startsWith(workspaceId));
      });

      if (!workspace) {
        console.error(`No workspace found containing collection from workspace ID ${workspaceId}`);
        return null;
      }

      return {
        id: workspace.id,
        name: workspace.name,
        type: workspace.type || 'personal'
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401) {
          console.error('Unauthorized: Check your Postman API key');
        } else {
          console.error(`Error fetching workspaces: ${error.response?.data?.error || error.message}`);
        }
      } else {
        console.error(`Unexpected error fetching workspaces: ${error}`);
      }
      return null;
    }
  }

  // handleListCollections method has been removed as it's no longer needed

  private async handleSearchCollection(args: any): Promise<any> {
    if (!args?.collectionId || !args?.query) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameters: collectionId, query'
      );
    }

    try {
      const response = await this.axiosInstance.get(`/collections/${args.collectionId}`);
      const collection: PostmanCollection = response.data.collection;
      
      // Get workspace info
      const workspaceId = args.collectionId.split('-')[0];
      const workspace = await this.getWorkspaceInfo(workspaceId);
      
      const searchResults = this.searchItems(
        collection.item,
        args.query.toLowerCase(),
        args.type || 'all'
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              workspace: workspace || null,
              collection: {
                id: args.collectionId,
                name: collection.info.name,
              },
              results: searchResults,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          content: [
            {
              type: 'text',
              text: `Error searching collection: ${error.response?.data?.error || error.message}`,
            },
          ],
          isError: true,
        };
      }
      throw error;
    }
  }

  private searchItems(
    items: PostmanItem[],
    query: string,
    type: string,
    path: string = ''
  ): any[] {
    const results: any[] = [];

    for (const item of items) {
      const currentPath = path ? `${path} / ${item.name}` : item.name;

      if (item.item) {
        // This is a folder
        if ((type === 'all' || type === 'folder') && item.name.toLowerCase().includes(query)) {
          results.push({
            type: 'folder',
            id: item.id,
            name: item.name,
            path: currentPath,
          });
        }
        // Recursively search in folder
        results.push(...this.searchItems(item.item, query, type, currentPath));
      } else if (item.request) {
        // This is a request
        if ((type === 'all' || type === 'request') && item.name.toLowerCase().includes(query)) {
          results.push({
            type: 'request',
            id: item.id,
            name: item.name,
            method: item.request.method,
            path: currentPath,
          });
        }
      }
    }

    return results;
  }

  private async handleGetCollectionStructure(args: any): Promise<any> {
    if (!args?.collectionId) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameter: collectionId'
      );
    }

    try {
      const response = await this.axiosInstance.get(`/collections/${args.collectionId}`);
      const collection: PostmanCollection = response.data.collection;
      
      // Get workspace info
      const workspaceId = args.collectionId.split('-')[0];
      const workspace = await this.getWorkspaceInfo(workspaceId);
      
      const structure = this.buildCollectionStructure(collection.item);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              workspace: workspace || null,
              collection: {
                id: args.collectionId,
                name: collection.info.name,
              },
              structure,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          content: [
            {
              type: 'text',
              text: `Error getting collection structure: ${error.response?.data?.error || error.message}`,
            },
          ],
          isError: true,
        };
      }
      throw error;
    }
  }

  private buildCollectionStructure(items: PostmanItem[], path: string = ''): any {
    const structure: any = {
      folders: [],
      requests: [],
    };

    for (const item of items) {
      const currentPath = path ? `${path} / ${item.name}` : item.name;

      if (item.item) {
        // This is a folder
        const folderStructure = this.buildCollectionStructure(item.item, currentPath);
        structure.folders.push({
          id: item.id,
          name: item.name,
          path: currentPath,
          ...folderStructure,
        });
      } else if (item.request) {
        // This is a request
        structure.requests.push({
          id: item.id,
          name: item.name,
          method: item.request.method,
          path: currentPath,
        });
      }
    }

    return structure;
  }

  private async handleGetRequestDetails(args: any): Promise<any> {
    if (!args?.collectionId || !args?.requestId) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameters: collectionId, requestId'
      );
    }

    try {
      const response = await this.axiosInstance.get(`/collections/${args.collectionId}`);
      const collection: PostmanCollection = response.data.collection;
      
      // Get workspace info
      const workspaceId = args.collectionId.split('-')[0];
      const workspace = await this.getWorkspaceInfo(workspaceId);
      
      const request = this.findRequestById(collection.item, args.requestId);
      if (!request) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Request not found: ${args.requestId}`
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              workspace: workspace ? {
                id: workspace.id,
                name: workspace.name,
                type: workspace.type,
              } : {
                id: workspaceId,
                name: 'Unknown',
                type: 'unknown',
              },
              collection: {
                id: args.collectionId,
                name: collection.info.name,
              },
              request: this.formatRequestDocumentation(request),
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          content: [
            {
              type: 'text',
              text: `Error getting request details: ${error.response?.data?.error || error.message}`,
            },
          ],
          isError: true,
        };
      }
      throw error;
    }
  }

  private findRequestById(items: PostmanItem[], requestId: string): PostmanItem | null {
    for (const item of items) {
      if (item.id === requestId) {
        return item;
      }
      // If the item has nested items (folders), search recursively
      if (item.item) {
        const found = this.findRequestById(item.item, requestId);
        if (found) return found;
      }
    }
    return null;
  }

  private formatRequestDocumentation(item: PostmanItem) {
    return {
      id: item.id,
      name: item.name,
      method: item.request?.method,
      url: item.request?.url.raw,
      description: item.request?.description || '',
      headers: item.request?.header || [],
      body: item.request?.body,
      responses: item.response || [],
    };
  }

  private async handleCreateAction(args: any): Promise<any> {
    if (!args?.collectionId || !args?.requestId || !args?.language) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameters: collectionId, requestId, language'
      );
    }

    try {
      const response = await this.axiosInstance.get(`/collections/${args.collectionId}`);
      const collection: PostmanCollection = response.data.collection;

      // Get workspace info
      const workspaceId = args.collectionId.split('-')[0];
      const workspace = await this.getWorkspaceInfo(workspaceId);

      const request = this.findRequestById(collection.item, args.requestId);
      if (!request || !request.request) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Request not found: ${args.requestId}`
        );
      }

      const actionCode = this.generateActionCode(
        request.name,
        request.request,
        args.language,
        args.agentFramework
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              workspace: workspace ? {
                id: workspace.id,
                name: workspace.name,
                type: workspace.type,
              } : {
                id: workspaceId,
                name: 'Unknown',
                type: 'unknown',
              },
              collection: {
                id: args.collectionId,
                name: collection.info.name,
              },
              code: actionCode,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          content: [
            {
              type: 'text',
              text: `Error generating action: ${error.response?.data?.error || error.message}`,
            },
          ],
          isError: true,
        };
      }
      throw error;
    }
  }

  private generateActionCode(
    name: string,
    request: NonNullable<PostmanItem['request']>,
    language: string,
    framework: string
  ): string {
    const baseUrl = request.url.host.join('.');
    const path = request.url.path.join('/');
    const method = request.method.toLowerCase();
    const headers = request.header || [];
    const body = request.body;

    if (language === 'python') {
      return this.generatePythonCode(name, request, framework);
    }

    return this.generateJavaScriptCode(name, request, language === 'typescript', framework);
  }

  private generatePythonCode(
    name: string,
    request: NonNullable<PostmanItem['request']>,
    framework?: string
  ): string {
    const baseUrl = request.url.host.join('.');
    const path = request.url.path.join('/');
    const method = request.method.toLowerCase();
    const headers = request.header || [];
    const body = request.body;

    let code = 'import requests\n';
    code += 'from typing import Dict, Any\n';

    // Add framework-specific imports if framework is specified
    if (framework) {
      switch (framework) {
        case 'openai':
          code += 'from openai import OpenAI\n';
          break;
        case 'anthropic':
          code += 'from anthropic import Anthropic\n';
          break;
        // Add other frameworks as needed
      }
    }
    code += '\n';

    // Generate the main function with type hints
    code += `async def ${name}(params: Dict[str, Any]) -> Dict[str, Any]:\n`;
    code += `    url = '${baseUrl}/${path}'\n`;
    
    // Add headers
    if (headers.length > 0) {
      code += `    headers = ${JSON.stringify(
        headers.reduce((acc: any, h: any) => ({ ...acc, [h.key]: h.value }), {}),
        null,
        4
      ).replace(/^/gm, '    ')}\n`;
    }

    // Add request body if present
    if (body) {
      switch (body.mode) {
        case 'raw':
          code += `    request_body = ${body.raw || '{}'}\n`;
          break;
        case 'urlencoded':
          code += '    request_body = {}\n';
          body.urlencoded?.forEach((param: any) => {
            code += `    request_body['${param.key}'] = params['${param.key}']\n`;
          });
          break;
      }
    }

    // Generate the requests call
    code += '\n    response = requests.request(\n';
    code += `        method='${method}',\n`;
    code += `        url=url,\n`;
    if (headers.length > 0) code += '        headers=headers,\n';
    if (body) {
      if (body.mode === 'urlencoded') {
        code += '        data=request_body,\n';
      } else {
        code += '        json=request_body,\n';
      }
    }
    code += '    )\n\n';
    
    code += '    if not response.ok:\n';
    code += "        raise Exception(f'HTTP error! status: {response.status_code}')\n\n";
    code += '    return response.json()\n';

    return code;
  }

  private generateJavaScriptCode(
    name: string,
    request: NonNullable<PostmanItem['request']>,
    isTypescript: boolean,
    framework?: string
  ): string {
    const baseUrl = request.url.host.join('.');
    const path = request.url.path.join('/');
    const method = request.method.toLowerCase();
    const headers = request.header || [];
    const body = request.body;

    let code = '';

    // Add framework-specific imports if framework is specified
    if (framework) {
      switch (framework) {
        case 'openai':
          code += `import OpenAI from 'openai';\n\n`;
          break;
        case 'anthropic':
          code += `import Anthropic from '@anthropic-ai/sdk';\n\n`;
          break;
        // Add other frameworks as needed
      }
    }

    // Generate function signature
    if (isTypescript) {
      code += `interface ${name}Params {\n`;
      // Add parameters based on request body/query params
      code += `}\n\n`;
    }

    // Generate the main function
    code += `export async function ${name}(${isTypescript ? 'params: ' + name + 'Params' : 'params'}) {\n`;
    code += `  const url = '${baseUrl}/${path}';\n`;
    
    // Add headers
    if (headers.length > 0) {
      code += `  const headers = ${JSON.stringify(
        headers.reduce((acc: any, h: any) => ({ ...acc, [h.key]: h.value }), {}),
        null,
        2
      )};\n`;
    }

    // Add request body if present
    if (body) {
      switch (body.mode) {
        case 'raw':
          code += `  const requestBody = ${body.raw || '{}'};\n`;
          break;
        case 'urlencoded':
          code += `  const requestBody = new URLSearchParams();\n`;
          body.urlencoded?.forEach((param: any) => {
            code += `  requestBody.append('${param.key}', params.${param.key});\n`;
          });
          break;
        // Add other body modes as needed
      }
    }

    // Generate the fetch call
    code += `\n  const response = await fetch(url, {\n`;
    code += `    method: '${method}',\n`;
    if (headers.length > 0) code += `    headers,\n`;
    if (body) code += `    body: ${body.mode === 'urlencoded' ? 'requestBody' : 'JSON.stringify(requestBody)'},\n`;
    code += `  });\n\n`;
    code += `  if (!response.ok) {\n`;
    code += `    throw new Error(\`HTTP error! status: \${response.status}\`);\n`;
    code += `  }\n\n`;
    code += `  return await response.json();\n`;
    code += `}\n`;

    return code;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Postman Documentation MCP server running on stdio');
  }
}

const server = new PostmanDocsServer();
server.run().catch(console.error);
