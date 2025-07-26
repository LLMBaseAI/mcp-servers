// JSR-compatible standalone version without workspace dependencies or external packages
// This file includes all necessary types and utilities inline

import { WorkerEntrypoint } from 'cloudflare:workers';
import type { WebFetchOptions, WebFetchResult, WebFetcherEnv } from './types';
import { WebFetcher } from './services/web-fetcher-jsr';

// Inline shared types (normally from @llmbase/mcp-shared)
export interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp: string;
}

export interface MCPServerInfo {
  name: string;
  version: string;
  description: string;
  tools: string[];
}

export interface BaseEnv {
  ENVIRONMENT?: string;
}

// Inline utility functions (normally from @llmbase/mcp-shared)
export function createSuccessResponse<T>(data: T): MCPResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
}

export function createErrorResponse(error: string, code?: string): MCPResponse {
  return {
    success: false,
    error,
    code,
    timestamp: new Date().toISOString()
  };
}

// Main server class
export class WebFetcherMCPServer extends WorkerEntrypoint<WebFetcherEnv> {
  private webFetcher: WebFetcher;

  constructor(ctx: ExecutionContext, env: WebFetcherEnv) {
    super(ctx, env);
    this.webFetcher = new WebFetcher();
  }

  getServerInfo(): MCPServerInfo {
    return {
      name: '@llmbase/mcp-servers/web-fetch',
      version: '1.0.0',
      description: 'MCP server for web content fetching and processing',
      tools: ['fetchWebsite', 'fetchMultipleWebsites', 'extractWebsiteMetadata', 'checkWebsiteStatus']
    };
  }

  /**
   * Validate environment setup
   */
  protected validateEnvironment(): void {
    // Add any environment validation here if needed
  }

  /**
   * Log messages with context
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, context?: any): void {
    console[level](`[WebFetcherMCPServer] ${message}`, context ? JSON.stringify(context) : '');
  }

  /**
   * Fetch a website and return its content as raw text, markdown, or plain text.
   */
  async fetchWebsite(
    url: string,
    format: 'raw' | 'markdown' | 'text' = 'markdown',
    followRedirects: boolean = true,
    timeout: number = 30000,
    userAgent?: string,
    headers?: Record<string, string>
  ): Promise<MCPResponse<any>> {
    try {
      this.validateEnvironment();
      
      const options: WebFetchOptions = {
        url,
        format,
        followRedirects,
        timeout,
        userAgent,
        headers
      };

      const result = await this.webFetcher.fetchWebsite(options);
      
      return createSuccessResponse({
        content: result.content,
        title: result.title,
        url: result.url,
        finalUrl: result.finalUrl,
        contentType: result.contentType,
        statusCode: result.statusCode,
        format,
        fetchedAt: new Date().toISOString()
      });
    } catch (error) {
      this.log('error', 'Failed to fetch website', { url, error: error instanceof Error ? error.message : 'Unknown error' });
      return createErrorResponse(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'FETCH_ERROR'
      );
    }
  }

  /**
   * Fetch multiple websites concurrently.
   */
  async fetchMultipleWebsites(
    urls: string[],
    format: 'raw' | 'markdown' | 'text' = 'markdown',
    maxConcurrent: number = 5,
    followRedirects: boolean = true,
    timeout: number = 30000
  ): Promise<MCPResponse<any>> {
    try {
      this.validateEnvironment();
      
      if (urls.length === 0) {
        return createErrorResponse('No URLs provided', 'INVALID_INPUT');
      }

      if (urls.length > 20) {
        return createErrorResponse('Too many URLs. Maximum 20 URLs allowed per request.', 'INVALID_INPUT');
      }

      // Process URLs in batches to respect concurrency limits
      const results = [];
      for (let i = 0; i < urls.length; i += maxConcurrent) {
        const batch = urls.slice(i, i + maxConcurrent);
        const batchResults = await this.webFetcher.fetchMultiple(batch, {
          format,
          followRedirects,
          timeout
        });
        results.push(...batchResults);
      }

      return createSuccessResponse({
        results: results.map((result, index) => ({
          url: urls[index],
          success: result.statusCode >= 200 && result.statusCode < 400,
          content: result.content,
          title: result.title,
          finalUrl: result.finalUrl,
          contentType: result.contentType,
          statusCode: result.statusCode,
          error: (result as any).error || null
        })),
        summary: {
          totalRequested: urls.length,
          successful: results.filter(r => r.statusCode >= 200 && r.statusCode < 400).length,
          failed: results.filter(r => r.statusCode < 200 || r.statusCode >= 400).length
        }
      });
    } catch (error) {
      this.log('error', 'Failed to fetch multiple websites', { 
        urlCount: urls.length, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return createErrorResponse(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'FETCH_ERROR'
      );
    }
  }

  /**
   * Extract metadata from a website without downloading the full content.
   */
  async extractWebsiteMetadata(url: string): Promise<MCPResponse<any>> {
    try {
      this.validateEnvironment();
      
      const result = await this.webFetcher.fetchWebsite({
        url,
        format: 'raw',
        timeout: 15000
      });

      const metadata = await this.webFetcher.extractMetadata(result.content);

      return createSuccessResponse({
        url: result.url,
        finalUrl: result.finalUrl,
        title: result.title,
        statusCode: result.statusCode,
        contentType: result.contentType,
        metadata,
        fetchedAt: new Date().toISOString()
      });
    } catch (error) {
      this.log('error', 'Failed to extract website metadata', { 
        url, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return createErrorResponse(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'METADATA_ERROR'
      );
    }
  }

  /**
   * Check if a URL is accessible without downloading the content.
   */
  async checkWebsiteStatus(url: string): Promise<MCPResponse<any>> {
    try {
      this.validateEnvironment();
      
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CloudflareWorker-MCP/1.0)'
        },
        redirect: 'follow'
      });

      return createSuccessResponse({
        url,
        finalUrl: response.url,
        statusCode: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        lastModified: response.headers.get('last-modified'),
        server: response.headers.get('server'),
        accessible: response.ok,
        checkedAt: new Date().toISOString()
      });
    } catch (error) {
      this.log('error', 'Failed to check website status', { 
        url, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return createErrorResponse(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'STATUS_CHECK_ERROR'
      );
    }
  }
}

// Re-export other utilities for JSR compatibility
export { WebFetcher } from './services/web-fetcher-jsr';
export { HTMLProcessor } from './utils/html-processor-jsr';
export type { WebFetchOptions, WebFetchResult, WebFetcherEnv } from './types';