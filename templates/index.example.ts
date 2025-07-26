// Self-hosted MCP servers deployment example
// This file shows how to create your own Cloudflare Worker with MCP servers

import { Hono } from 'hono';
import { WebFetcherMCPServer } from '@llmbase/mcp-web-fetch';
import { SSEService, MCPSSEHandler } from '@llmbase/mcp-core/sse';

// Define your environment interface
interface Env {
  ENVIRONMENT?: string;
  MCP_CACHE?: KVNamespace;
  FILES?: R2Bucket;
}

// Create Hono app
const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('/*', async (c, next) => {
  c.res.headers.set('Access-Control-Allow-Origin', '*');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (c.req.method === 'OPTIONS') {
    return c.text('', 200);
  }
  
  await next();
});

// Health check
app.get('/', (c) => {
  return c.json({
    service: 'My Self-Hosted MCP Servers',
    version: '1.0.0',
    servers: [
      {
        name: 'web-fetcher',
        description: 'Fetch websites as raw text, markdown, or plain text',
        endpoint: '/mcp/web-fetch',
        tools: ['fetchWebsite', 'fetchMultipleWebsites', 'extractWebsiteMetadata', 'checkWebsiteStatus']
      }
      // Add more servers here as needed
    ],
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Web Fetcher MCP Server (SSE transport - no auth required)
app.get('/mcp/web-fetch', (c) => {
  const acceptHeader = c.req.header('Accept') || '';
  
  // Check if client accepts text/event-stream
  if (!acceptHeader.includes('text/event-stream')) {
    return c.json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Not Acceptable: Client must accept text/event-stream'
      },
      id: null
    }, 406);
  }
  
  const sessionId = c.req.query('session') || undefined;
  const handler = new MCPSSEHandler(sessionId);
  return handler.createMCPSSEResponse();
});

// Export for Cloudflare Workers
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;