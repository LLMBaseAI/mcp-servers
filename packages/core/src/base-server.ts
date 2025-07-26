import { WorkerEntrypoint } from 'cloudflare:workers';
import type { BaseEnv, MCPServerInfo, MCPResponse } from '@llmbase/mcp-shared';
import { createSuccessResponse, createErrorResponse } from '@llmbase/mcp-shared';

/**
 * Base class for all MCP servers
 */
export abstract class BaseMCPServer extends WorkerEntrypoint<BaseEnv> {
  
  /**
   * Get server information for discovery
   */
  abstract getServerInfo(): MCPServerInfo;

  /**
   * Get server version
   */
  getVersion(): string {
    return this.getServerInfo().version;
  }

  /**
   * Health check method
   */
  async healthCheck(): Promise<MCPResponse<{ status: string; timestamp: string; server: string }>> {
    try {
      const serverInfo = this.getServerInfo();
      return createSuccessResponse({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: serverInfo.name
      });
    } catch (error) {
      return createErrorResponse(
        error instanceof Error ? error.message : 'Health check failed',
        'HEALTH_CHECK_ERROR'
      );
    }
  }

  /**
   * Get available tools for this server
   */
  getTools(): string[] {
    return this.getServerInfo().tools;
  }

  /**
   * Validate environment requirements
   */
  protected validateEnvironment(): void {
    // Override in subclasses to add specific environment validation
  }

  /**
   * Get a safe subset of environment variables for logging
   */
  protected getSafeEnvInfo(): Record<string, any> {
    return {
      environment: this.env.ENVIRONMENT || 'development',
      hasCache: !!this.env.MCP_CACHE,
      hasFiles: !!this.env.FILES
    };
  }

  /**
   * Log information safely (no sensitive data)
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logData = {
      server: this.getServerInfo().name,
      level,
      message,
      timestamp: new Date().toISOString(),
      ...data
    };

    if (level === 'error') {
      console.error(JSON.stringify(logData));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(logData));
    } else {
      console.log(JSON.stringify(logData));
    }
  }
}