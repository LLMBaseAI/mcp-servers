# Claude Code Development Context

## Project Overview

This is a **MCP (Model Context Protocol) Servers by LLM Base** project built with Hono.js, designed to host multiple MCP servers on Cloudflare Workers. The project currently implements a **Web Fetcher MCP Server** that allows Claude and other MCP clients to fetch websites as raw text, markdown, or plain text.

## Key Information for Development

### Host Configuration
- **Production URL**: `https://mcp.llmbase.ai`
- **Custom Domain**: Configured in `wrangler.jsonc`
- **Workers Deployment**: Uses Cloudflare Workers with custom domain routing

### Project Structure
```
src/
├── index.ts                    # Main entry point and Worker handler
├── router.ts                   # Hono.js routing with all endpoints
├── types.ts                    # TypeScript type definitions
├── servers/                    # MCP server implementations
│   └── web-fetcher-server.ts   # Web fetching MCP server
├── services/                   # Business logic services  
│   ├── web-fetcher.ts          # Core web fetching service
│   └── sse-service.ts          # Server-Sent Events handling
└── utils/                      # Utility functions
    └── html-processor.ts       # HTML to text/markdown conversion
```

### Current MCP Servers

#### Web Fetcher Server
- **Endpoint**: `/mcp/web-fetcher`
- **SSE Endpoint**: `/sse/web-fetcher`
- **API Prefix**: `/api/`
- **Stream Prefix**: `/stream/web-fetcher/`

**Available Tools:**
- `fetchWebsite(url, format?, followRedirects?, timeout?, userAgent?, headers?)` - Fetch single website
- `fetchMultipleWebsites(urls, format?, maxConcurrent?, followRedirects?, timeout?)` - Fetch multiple websites
- `extractWebsiteMetadata(url)` - Extract metadata from website
- `checkWebsiteStatus(url)` - Check if website is accessible

### Technology Stack

#### Core Framework
- **Hono.js**: Fast web framework for Cloudflare Workers
- **TypeScript**: Full type safety with strict configuration
- **Cloudflare Workers**: Serverless platform with global edge distribution

#### MCP Integration
- **workers-mcp v0.0.13**: Cloudflare's official MCP integration
- **Streamable HTTP Transport**: Modern MCP protocol (primary)
- **SSE Transport**: Server-Sent Events for backward compatibility

#### HTML Processing
- **Turndown.js**: HTML to Markdown conversion (primary method)
- **HTMLRewriter**: Cloudflare's native HTML processing (fallback)
- **Plain Text Parser**: Basic HTML tag stripping

### Architecture Patterns

#### Endpoint Structure
```
https://mcp.llmbase.ai/
├── /                           # Health check & service discovery
├── /mcp/{service}              # MCP Streamable HTTP transport
├── /sse/{service}              # MCP SSE transport (legacy)
├── /api/{service}/{action}     # REST API endpoints
├── /stream/{service}/{type}    # Real-time streaming endpoints
└── /sse/stream                 # Generic SSE streaming
```

#### Adding New Services
1. Create server class in `src/servers/{service}-server.ts`
2. Extend `WorkerEntrypoint<Env>`
3. Add MCP methods with proper JSDoc comments
4. Register routes in `src/router.ts`
5. Update health check endpoint with service info

### Development Commands

```bash
# Install dependencies
bun install

# Development server
bun run dev

# Build TypeScript
bun run build

# Deploy to Cloudflare Workers
bun run deploy

# Lint code
bun run lint

# Format code
bun run format
```

### Configuration Files

#### `wrangler.jsonc`
- Uses JSONC format for comments
- Custom domain configuration for `mcp.llmbase.ai`
- Node.js compatibility enabled for Turndown
- Environment variables for production settings

#### `package.json`
- Uses Bun as package manager
- TypeScript build configuration
- ESLint and Prettier for code quality
- Wrangler for Workers deployment

### Security Features

#### URL Validation
- Blocks localhost and private IP ranges
- Only allows HTTP/HTTPS protocols
- Validates URL format before processing

#### Request Limits
- Configurable timeouts (default: 30 seconds)
- Maximum 20 URLs per batch request
- Concurrent request limiting (default: 5)

#### Headers & CORS
- Proper CORS configuration for all endpoints
- Security headers for SSE streams
- User-Agent spoofing protection

### Testing & Debugging

#### Manual Testing Endpoints
```bash
# Health check
curl https://mcp.llmbase.ai/

# Single fetch
curl -X POST https://mcp.llmbase.ai/api/fetch \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "format": "markdown"}'

# Streaming batch
curl -X POST https://mcp.llmbase.ai/stream/web-fetcher/batch \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://example.com"]}' \
  --no-buffer
```

#### MCP Client Testing
Use Claude Desktop with this configuration:
```json
{
  "mcpServers": {
    "web-fetcher": {
      "command": "npx",
      "args": ["workers-mcp", "run", "web-fetcher", "https://mcp.llmbase.ai/mcp/web-fetcher"]
    }
  }
}
```

### Common Development Tasks

#### Adding a New MCP Tool to Web Fetcher
1. Add method to `WebFetcherMCPServer` class
2. Include proper JSDoc with parameter descriptions
3. Add to tools list in router health check
4. Test with MCP client

#### Adding a New MCP Server
1. Create `src/servers/{name}-server.ts`
2. Implement server class extending `WorkerEntrypoint<Env>`
3. Add routes in `src/router.ts`:
   ```typescript
   app.all('/mcp/{name}/*', async (c) => {
     const server = new YourMCPServer(c.executionCtx, c.env);
     const proxy = new ProxyToSelf(server);
     return proxy.fetch(c.req.raw);
   });
   ```
4. Update health check response with new server info

#### Debugging SSE Streams
- Check browser Network tab for SSE connections
- Verify `text/event-stream` content type
- Ensure proper message formatting with `data:` prefix
- Test connection persistence and error handling

### Error Handling Patterns

#### Service Errors
- Always return structured error responses
- Include timestamp and error codes
- Log errors to console for Cloudflare Workers logs
- Handle timeout and network errors gracefully

#### MCP Protocol Errors
- Follow JSON-RPC 2.0 error format
- Include proper error codes and messages
- Handle session management for SSE transport

### Performance Considerations

#### Caching Strategy
- Optional KV namespace for response caching
- Consider caching metadata extraction results
- Implement cache invalidation for dynamic content

#### Concurrent Processing
- Batch requests use controlled concurrency
- Default max 5 concurrent requests per batch
- Configurable batch sizes for different use cases

#### Memory Management
- Stream large responses to avoid memory issues
- Use HTMLRewriter for efficient HTML processing
- Clean up resources in SSE stream handlers

### Deployment Notes

#### Cloudflare Workers Limits
- 30-second execution timeout (configured in wrangler.jsonc)
- Memory and CPU limitations
- 1MB response size limit for regular responses
- Streaming responses can be larger

#### Custom Domain Setup
- DNS CNAME record: `mcp.llmbase.ai` → `{worker-name}.{account}.workers.dev`
- SSL certificate automatically managed by Cloudflare
- Route configuration in `wrangler.jsonc`

### Monitoring & Observability

#### Cloudflare Dashboard
- Monitor request volume and errors
- Check performance metrics
- View real-time logs

#### Error Tracking
- Structured error logging in console
- Include request context in error messages
- Monitor SSE connection drops and retries

### Future Enhancements

#### Planned Features
- File processing MCP server
- Database query MCP server
- AI/ML inference MCP server
- Search and indexing MCP server

#### Technical Improvements
- Request caching with KV storage
- Rate limiting per client
- Authentication and authorization
- Metrics collection and alerting

### Troubleshooting Common Issues

#### Build Errors
- Check TypeScript version compatibility
- Ensure all dependencies are properly installed
- Verify `@types/turndown` is in devDependencies

#### Runtime Errors
- Check environment configuration in wrangler.jsonc
- Verify custom domain DNS configuration
- Test with basic HTTP endpoints before MCP integration

#### MCP Connection Issues
- Verify workers-mcp version compatibility
- Check Claude Desktop configuration syntax
- Test SSE endpoints with browser or curl

### Code Style & Standards

- TypeScript strict mode enabled
- ESLint configuration for code quality
- Prettier for consistent formatting  
- No console.log in production (use console.error for errors)
- Comprehensive JSDoc for all public methods
- Interface-first design with proper type definitions

## Quick Start for New Developers

1. Clone repository
2. Run `bun install`
3. Update `wrangler.jsonc` with your account details
4. Run `bun run dev` for local development
5. Test endpoints with curl or Postman
6. Deploy with `bun run deploy`
7. Configure Claude Desktop with your deployed URL

## Important Files to Know

- **`src/router.ts`** - All endpoint definitions and routing
- **`src/servers/web-fetcher-server.ts`** - Main MCP server implementation
- **`src/services/web-fetcher.ts`** - Core business logic
- **`src/types.ts`** - All TypeScript interfaces
- **`wrangler.jsonc`** - Cloudflare Workers configuration
- **`ENDPOINTS.md`** - Complete API documentation

This project follows MCP protocol standards and Cloudflare Workers best practices for scalable, serverless MCP server hosting.