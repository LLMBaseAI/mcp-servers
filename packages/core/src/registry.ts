import type { MCPServerInfo, MCPServerRegistryInfo, BaseEnv } from '@llmbase/mcp-shared';
import { BaseMCPServer } from './base-server';

/**
 * Server registry for dynamically loading MCP servers
 */
export interface ServerRegistryEntry extends MCPServerRegistryInfo {
  serverClass: new (ctx: ExecutionContext, env: BaseEnv) => BaseMCPServer;
}

export class MCPServerRegistry {
  private servers = new Map<string, ServerRegistryEntry>();

  /**
   * Register a new MCP server
   */
  register(name: string, entry: ServerRegistryEntry): void {
    this.servers.set(name, entry);
  }

  /**
   * Get a registered server
   */
  get(name: string): ServerRegistryEntry | undefined {
    return this.servers.get(name);
  }

  /**
   * Get all registered servers
   */
  getAll(): ServerRegistryEntry[] {
    return Array.from(this.servers.values());
  }

  /**
   * Get server info for discovery endpoint
   */
  getServerInfoList(): Omit<ServerRegistryEntry, 'serverClass'>[] {
    return this.getAll().map(({ serverClass, ...rest }) => rest);
  }

  /**
   * Check if a server is registered
   */
  has(name: string): boolean {
    return this.servers.has(name);
  }

  /**
   * Create an instance of a registered server
   */
  createInstance(name: string, ctx: ExecutionContext, env: BaseEnv): BaseMCPServer {
    const entry = this.get(name);
    if (!entry) {
      throw new Error(`Server '${name}' not found in registry`);
    }
    return new entry.serverClass(ctx, env);
  }

  /**
   * Get available server names
   */
  getServerNames(): string[] {
    return Array.from(this.servers.keys());
  }
}

// Export a global registry instance
export const globalServerRegistry = new MCPServerRegistry();