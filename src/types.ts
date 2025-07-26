export interface Env {
  ENVIRONMENT?: string;
  MCP_CACHE?: KVNamespace;
  FILES?: R2Bucket;
}

// Inline types from @llmbase/mcp-shared for standalone npm package
export interface MCPServerInfo {
  name: string;
  description: string;
  version: string;
  tools: string[];
  author?: {
    name: string;
    url?: string;
    email?: string;
  };
  repository?: string;
  homepage?: string;
}

export interface WebFetchOptions {
  url: string;
  format?: 'raw' | 'markdown' | 'text';
  followRedirects?: boolean;
  timeout?: number;
  userAgent?: string;
  headers?: Record<string, string>;
}

export interface WebFetchResult {
  content: string;
  contentType: string;
  url: string;
  title?: string;
  statusCode: number;
  finalUrl?: string;
}

export interface MCPServer {
  name: string;
  description: string;
  version: string;
  tools: MCPTool[];
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface HTMLProcessorOptions {
  removeScripts?: boolean;
  removeStyles?: boolean;
  preserveLinks?: boolean;
  baseUrl?: string;
}