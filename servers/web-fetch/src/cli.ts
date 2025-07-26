#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, Tool } from '@modelcontextprotocol/sdk/types.js';
import { WebFetcher } from './services/web-fetcher.js';
import type { WebFetchOptions } from './types.js';

class WebFetcherMCPStdioServer {
  private server: Server;
  private webFetcher: WebFetcher;

  constructor() {
    this.webFetcher = new WebFetcher();
    this.server = new Server({
      name: '@llmbase/mcp-web-fetch',
      version: '1.0.0'
    }, {
      capabilities: {
        tools: {}
      }
    });

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: 'fetchWebsite',
          description: 'Fetch a website and return its content as raw HTML, markdown, or plain text',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'The URL to fetch'
              },
              format: {
                type: 'string',
                enum: ['raw', 'markdown', 'text'],
                default: 'markdown',
                description: 'The format to return the content in'
              },
              followRedirects: {
                type: 'boolean',
                default: true,
                description: 'Whether to follow HTTP redirects'
              },
              timeout: {
                type: 'number',
                default: 30000,
                description: 'Timeout in milliseconds'
              },
              userAgent: {
                type: 'string',
                description: 'Custom user agent string'
              },
              headers: {
                type: 'object',
                description: 'Additional headers to send with the request',
                additionalProperties: { type: 'string' }
              }
            },
            required: ['url']
          }
        },
        {
          name: 'fetchMultipleWebsites',
          description: 'Fetch multiple websites concurrently',
          inputSchema: {
            type: 'object',
            properties: {
              urls: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of URLs to fetch'
              },
              format: {
                type: 'string',
                enum: ['raw', 'markdown', 'text'],
                default: 'markdown',
                description: 'The format to return the content in'
              },
              maxConcurrent: {
                type: 'number',
                default: 5,
                description: 'Maximum number of concurrent requests'
              },
              followRedirects: {
                type: 'boolean',
                default: true,
                description: 'Whether to follow HTTP redirects'
              },
              timeout: {
                type: 'number',
                default: 30000,
                description: 'Timeout in milliseconds per request'
              }
            },
            required: ['urls']
          }
        },
        {
          name: 'extractWebsiteMetadata',
          description: 'Extract metadata from a website without downloading the full content',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'The URL to analyze'
              }
            },
            required: ['url']
          }
        },
        {
          name: 'checkWebsiteStatus',
          description: 'Check if a URL is accessible without downloading the content',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'The URL to check'
              }
            },
            required: ['url']
          }
        }
      ];

      return { tools };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'fetchWebsite':
            return await this.handleFetchWebsite(args);
          case 'fetchMultipleWebsites':
            return await this.handleFetchMultipleWebsites(args);
          case 'extractWebsiteMetadata':
            return await this.handleExtractMetadata(args);
          case 'checkWebsiteStatus':
            return await this.handleCheckStatus(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    });
  }

  private async handleFetchWebsite(args: any) {
    const options: WebFetchOptions = {
      url: args.url,
      format: args.format || 'markdown',
      followRedirects: args.followRedirects ?? true,
      timeout: args.timeout || 30000,
      userAgent: args.userAgent,
      headers: args.headers
    };

    const result = await this.webFetcher.fetchWebsite(options);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            content: result.content,
            title: result.title,
            url: result.url,
            finalUrl: result.finalUrl,
            contentType: result.contentType,
            statusCode: result.statusCode,
            format: options.format,
            fetchedAt: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
  }

  private async handleFetchMultipleWebsites(args: any) {
    const { urls, format = 'markdown', maxConcurrent = 5, followRedirects = true, timeout = 30000 } = args;

    if (!urls || !Array.isArray(urls)) {
      throw new Error('URLs array is required');
    }

    if (urls.length > 20) {
      throw new Error('Too many URLs. Maximum 20 URLs allowed per request.');
    }

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

    const response = {
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
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2)
        }
      ]
    };
  }

  private async handleExtractMetadata(args: any) {
    const { url } = args;

    const result = await this.webFetcher.fetchWebsite({
      url,
      format: 'raw',
      timeout: 15000
    });

    const metadata = await this.webFetcher.extractMetadata(result.content);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            url: result.url,
            finalUrl: result.finalUrl,
            title: result.title,
            statusCode: result.statusCode,
            contentType: result.contentType,
            metadata,
            fetchedAt: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
  }

  private async handleCheckStatus(args: any) {
    const { url } = args;

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MCP-WebFetcher/1.0)'
        },
        redirect: 'follow'
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
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
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to check website status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// Start the server if this file is run directly
// Check if running as main module (for Node.js)
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const server = new WebFetcherMCPStdioServer();
  server.start().catch((error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}