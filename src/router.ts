import { Hono } from 'hono';
import type { BaseEnv, MCPServerInfo } from '@llmbase/mcp-shared';
import { WebFetcherMCPServer } from '../servers/web-fetch/src/index.js';
import { SSEService, MCPSSEHandler } from '@llmbase/mcp-core/sse';

// Available MCP servers registry
const AVAILABLE_SERVERS = {
  'web-fetch': {
    name: 'web-fetch',
    description: 'Fetch websites as raw text, markdown, or plain text',
    endpoint: '/mcp/web-fetch',
    sseEndpoint: '/sse/web-fetch',
    streamEndpoint: '/stream/web-fetch',
    tools: [
      'fetchWebsite',
      'fetchMultipleWebsites', 
      'extractWebsiteMetadata',
      'checkWebsiteStatus'
    ],
    serverClass: WebFetcherMCPServer
  }
} as const;

export function createRouter() {
  const app = new Hono<{ Bindings: BaseEnv }>();

  // Enable CORS for all routes
  app.use('/*', async (c, next) => {
    c.res.headers.set('Access-Control-Allow-Origin', '*');
    c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (c.req.method === 'OPTIONS') {
      return c.text('', 200);
    }
    
    await next();
  });

  // Health check endpoint
  app.get('/', (c) => {
    const servers = Object.values(AVAILABLE_SERVERS).map(({ serverClass, ...rest }) => rest);
    
    return c.json({
      service: 'MCP Servers by LLM Base',
      version: '1.0.0',
      servers,
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });

  // Web Fetch MCP Server (SSE transport - no auth required)
  app.get('/mcp/web-fetch', (c) => {
    const acceptHeader = c.req.header('Accept') || '';
    
    // Check if client accepts text/event-stream like context7 does
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

  // SSE Endpoints for MCP compatibility
  app.get('/sse/web-fetch', (c) => {
    const sessionId = c.req.query('session') || undefined;
    const handler = new MCPSSEHandler(sessionId);
    return handler.createMCPSSEResponse();
  });

  // Generic SSE stream endpoint
  app.get('/sse/stream', (c) => {
    const sessionId = c.req.query('session') || undefined;
    return SSEService.createSSEResponse(sessionId);
  });

  // Streaming endpoint for batch operations
  app.post('/stream/web-fetch/batch', async (c) => {
    try {
      const body = await c.req.json();
      const { urls, format = 'markdown', ...options } = body;
      
      if (!urls || !Array.isArray(urls)) {
        return c.json({ error: 'URLs array is required' }, 400);
      }

      const server = new WebFetcherMCPServer(c.executionCtx, c.env);
      
      // Create async generator for streaming results
      async function* batchProcessor() {
        yield { type: 'start', totalUrls: urls.length, timestamp: new Date().toISOString() };
        
        let completed = 0;
        const batchSize = Math.min(5, Math.max(1, options.maxConcurrent || 3));
        
        for (let i = 0; i < urls.length; i += batchSize) {
          const batch = urls.slice(i, i + batchSize);
          
          yield { 
            type: 'batch_start', 
            batchIndex: Math.floor(i / batchSize),
            urls: batch,
            timestamp: new Date().toISOString()
          };

          const promises = batch.map(async (url: string, index: number) => {
            try {
              const result = await server.fetchWebsite(url, format, options.followRedirects, options.timeout);
              completed++;
              return {
                type: 'result',
                url,
                index: i + index,
                completed,
                total: urls.length,
                success: result.success,
                data: result.data,
                error: result.success ? null : result.error,
                timestamp: new Date().toISOString()
              };
            } catch (error) {
              completed++;
              return {
                type: 'result',
                url,
                index: i + index,
                completed,
                total: urls.length,
                success: false,
                data: null,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
              };
            }
          });

          const results = await Promise.all(promises);
          for (const result of results) {
            yield result;
          }

          yield { 
            type: 'batch_complete', 
            batchIndex: Math.floor(i / batchSize),
            completed,
            total: urls.length,
            timestamp: new Date().toISOString()
          };
        }

        yield { 
          type: 'complete', 
          totalCompleted: completed,
          totalRequested: urls.length,
          timestamp: new Date().toISOString()
        };
      }

      return SSEService.createProgressStream(batchProcessor);
      
    } catch (error) {
      return c.json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }, 500);
    }
  });

  // Direct API endpoints for web fetcher (optional, for testing)
  app.post('/api/fetch', async (c) => {
    try {
      const body = await c.req.json();
      const { url, format = 'markdown', ...options } = body;
      
      if (!url) {
        return c.json({ error: 'URL is required' }, 400);
      }

      const server = new WebFetcherMCPServer(c.executionCtx, c.env);
      const result = await server.fetchWebsite(url, format, options.followRedirects, options.timeout, options.userAgent, options.headers);
      
      return c.json(result);
    } catch (error) {
      return c.json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }, 500);
    }
  });

  app.post('/api/fetch-multiple', async (c) => {
    try {
      const body = await c.req.json();
      const { urls, format = 'markdown', maxConcurrent = 5, ...options } = body;
      
      if (!urls || !Array.isArray(urls)) {
        return c.json({ error: 'URLs array is required' }, 400);
      }

      const server = new WebFetcherMCPServer(c.executionCtx, c.env);
      const result = await server.fetchMultipleWebsites(urls, format, maxConcurrent, options.followRedirects, options.timeout);
      
      return c.json(result);
    } catch (error) {
      return c.json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }, 500);
    }
  });

  app.post('/api/metadata', async (c) => {
    try {
      const body = await c.req.json();
      const { url } = body;
      
      if (!url) {
        return c.json({ error: 'URL is required' }, 400);
      }

      const server = new WebFetcherMCPServer(c.executionCtx, c.env);
      const result = await server.extractWebsiteMetadata(url);
      
      return c.json(result);
    } catch (error) {
      return c.json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }, 500);
    }
  });

  app.post('/api/status', async (c) => {
    try {
      const body = await c.req.json();
      const { url } = body;
      
      if (!url) {
        return c.json({ error: 'URL is required' }, 400);
      }

      const server = new WebFetcherMCPServer(c.executionCtx, c.env);
      const result = await server.checkWebsiteStatus(url);
      
      return c.json(result);
    } catch (error) {
      return c.json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }, 500);
    }
  });

  // 404 handler
  app.notFound((c) => {
    return c.json({
      error: 'Not Found',
      message: 'The requested endpoint was not found',
      availableEndpoints: [
        '/',
        '/mcp/web-fetch/*',
        '/sse/web-fetch',
        '/sse/stream',
        '/stream/web-fetch/batch',
        '/api/fetch',
        '/api/fetch-multiple',
        '/api/metadata',
        '/api/status'
      ]
    }, 404);
  });

  // Error handler
  app.onError((err, c) => {
    console.error('Application error:', err);
    return c.json({
      error: 'Internal Server Error',
      message: err.message
    }, 500);
  });

  return app;
}