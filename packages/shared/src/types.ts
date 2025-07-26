// Base Cloudflare Workers environment interface
export interface BaseEnv {
  ENVIRONMENT?: string;
  MCP_CACHE?: KVNamespace;
  FILES?: R2Bucket;
}

// MCP Server metadata interface (for server introspection)
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

// MCP Server registry entry (for router configuration)
export interface MCPServerRegistryInfo extends MCPServerInfo {
  endpoint: string;
  sseEndpoint?: string;
  streamEndpoint?: string;
}

// MCP Tool interface
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

// Standard MCP response interface
export interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp: string;
}

// Server-Sent Events message interface
export interface SSEMessage {
  id?: string;
  event?: string;
  data: string;
  retry?: number;
}

// MCP JSON-RPC message interface
export interface MCPJSONRPCMessage {
  jsonrpc: '2.0';
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// HTTP processing options
export interface ProcessingOptions {
  removeScripts?: boolean;
  removeStyles?: boolean;
  preserveLinks?: boolean;
  baseUrl?: string;
  timeout?: number;
  userAgent?: string;
  headers?: Record<string, string>;
}

// Registry for MCP servers
export interface MCPServerRegistry {
  [serverName: string]: {
    info: MCPServerInfo;
    factory: (env: BaseEnv, ctx: ExecutionContext) => any;
  };
}

// Configuration for individual MCP server packages
export interface MCPPackageConfig {
  name: string;
  version: string;
  description: string;
  serverClass: string;
  dependencies?: string[];
  optionalDependencies?: string[];
}

// Publishing configuration
export interface PublishConfig {
  npm: {
    access: 'public' | 'restricted';
    registry?: string;
  };
  jsr: {
    include?: string[];
    exclude?: string[];
  };
}