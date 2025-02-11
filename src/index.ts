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

class PostmanDocsServer {
  private server: Server;
  private axiosInstance;
  private API_KEY: string;

  constructor() {
    const apiKey = process.env.POSTMAN_API_KEY;
    if (!apiKey) {
      throw new Error('POSTMAN_API_KEY environment variable is required');
    }
    this.API_KEY = apiKey;

    this.server = new Server(
      {
        name: 'ib-postman-tool-generator',
        version: '0.1.0',
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

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'list_collections',
          description: 'List all available Postman collections',
          inputSchema: {
            type: 'object',
            properties: {
              workspace: {
                type: 'string',
                description: 'Optional: Workspace ID to filter collections',
              },
            },
          },
        },
        {
          name: 'search_collection',
          description: 'Search within a collection for folders or requests by name',
          inputSchema: {
            type: 'object',
            properties: {
              collectionId: {
                type: 'string',
                description: 'The Postman collection ID',
              },
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
            required: ['collectionId', 'query'],
          },
        },
        {
          name: 'get_collection_structure',
          description: 'Get the folder structure and request IDs for a collection',
          inputSchema: {
            type: 'object',
            properties: {
              collectionId: {
                type: 'string',
                description: 'The Postman collection ID',
              },
            },
            required: ['collectionId'],
          },
        },
        {
          name: 'get_request_details',
          description: 'Get detailed information about a specific request',
          inputSchema: {
            type: 'object',
            properties: {
              collectionId: {
                type: 'string',
                description: 'The Postman collection ID',
              },
              requestId: {
                type: 'string',
                description: 'The request ID',
              },
            },
            required: ['collectionId', 'requestId'],
          },
        },
        {
          name: 'create_action',
          description: 'Generate an AI action from a Postman request',
          inputSchema: {
            type: 'object',
            properties: {
              collectionId: {
                type: 'string',
                description: 'The Postman collection ID',
              },
              requestId: {
                type: 'string',
                description: 'The ID of the request to generate an action for',
              },
              language: {
                type: 'string',
                enum: ['javascript', 'typescript'],
                description: 'Programming language to use',
              },
              agentFramework: {
                type: 'string',
                enum: ['openai', 'mistral', 'gemini', 'anthropic', 'langchain', 'autogen'],
                description: 'AI agent framework to use',
              },
            },
            required: ['collectionId', 'requestId', 'language'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'list_collections':
          return this.handleListCollections(request.params.arguments);
        case 'search_collection':
          return this.handleSearchCollection(request.params.arguments);
        case 'get_collection_structure':
          return this.handleGetCollectionStructure(request.params.arguments);
        case 'get_request_details':
          return this.handleGetRequestDetails(request.params.arguments);
        case 'create_action':
          return this.handleCreateAction(request.params.arguments);
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

  private async handleListCollections(args: any): Promise<any> {
    try {
      const endpoint = args?.workspace 
        ? `/workspaces/${args.workspace}/collections`
        : '/collections';
      
      const response = await this.axiosInstance.get(endpoint);
      const collections = await Promise.all(response.data.collections.map(async (col: any) => {
        const workspaceId = col.workspace || col.uid.split('-')[0];
        const workspace = await this.getWorkspaceInfo(workspaceId);
        
        return {
          id: col.uid,
          name: col.name,
          updatedAt: col.updatedAt,
          workspace: workspace || null,
        };
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(collections, null, 2),
          },
        ],
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          content: [
            {
              type: 'text',
              text: `Error listing collections: ${error.response?.data?.error || error.message}`,
            },
          ],
          isError: true,
        };
      }
      throw error;
    }
  }

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

    let code = '';
    const isTypescript = language === 'typescript';

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
