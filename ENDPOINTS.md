# MCP Server Endpoints - https://mcp.llmbase.ai

## Web Fetcher Service Endpoints

### MCP Transport Endpoints

#### Streamable HTTP (Recommended)
- **URL**: `https://mcp.llmbase.ai/mcp/web-fetcher`
- **Description**: Modern MCP protocol with optional streaming
- **Usage**: Primary endpoint for MCP clients using Streamable HTTP transport

#### SSE Transport (Legacy)
- **URL**: `https://mcp.llmbase.ai/sse/web-fetcher`
- **Description**: Server-Sent Events transport for backward compatibility
- **Usage**: Legacy MCP clients that require pure SSE transport

### REST API Endpoints

#### Single Website Fetch
- **URL**: `https://mcp.llmbase.ai/api/fetch`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Body**:
```json
{
  "url": "https://example.com",
  "format": "markdown",  // optional: "raw", "markdown", "text"
  "followRedirects": true,  // optional
  "timeout": 30000,  // optional, milliseconds
  "userAgent": "Custom-Agent",  // optional
  "headers": {}  // optional
}
```

#### Batch Website Fetch
- **URL**: `https://mcp.llmbase.ai/api/fetch-multiple`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Body**:
```json
{
  "urls": ["https://example.com", "https://github.com"],
  "format": "markdown",  // optional
  "maxConcurrent": 5,  // optional
  "followRedirects": true,  // optional
  "timeout": 30000  // optional
}
```

#### Website Metadata Extraction
- **URL**: `https://mcp.llmbase.ai/api/metadata`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Body**:
```json
{
  "url": "https://example.com"
}
```

#### Website Status Check
- **URL**: `https://mcp.llmbase.ai/api/status`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Body**:
```json
{
  "url": "https://example.com"
}
```

### Streaming Endpoints

#### Real-time Batch Processing
- **URL**: `https://mcp.llmbase.ai/stream/web-fetcher/batch`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Response**: Server-Sent Events stream
- **Body**:
```json
{
  "urls": ["https://example.com", "https://github.com"],
  "format": "markdown",
  "maxConcurrent": 3
}
```

#### Generic SSE Stream
- **URL**: `https://mcp.llmbase.ai/sse/stream`
- **Method**: `GET`
- **Query Parameters**: `?session=optional-session-id`
- **Response**: Server-Sent Events stream

### System Endpoints

#### Health Check / Service Discovery
- **URL**: `https://mcp.llmbase.ai/`
- **Method**: `GET`
- **Response**:
```json
{
  "service": "MCP Servers by LLM Base",
  "version": "1.0.0",
  "servers": [
    {
      "name": "web-fetcher",
      "description": "Fetch websites as raw text, markdown, or plain text",
      "endpoint": "/mcp/web-fetcher",
      "sseEndpoint": "/sse/web-fetcher",
      "streamEndpoint": "/stream/web-fetcher",
      "tools": ["fetchWebsite", "fetchMultipleWebsites", "extractWebsiteMetadata", "checkWebsiteStatus"]
    }
  ],
  "status": "healthy",
  "timestamp": "2024-12-18T10:00:00.000Z"
}
```

## Future Service Endpoint Patterns

When adding new MCP servers to this platform, they would follow this pattern:

### Service Name: `example-service`

#### MCP Transport Endpoints
- **Streamable HTTP**: `https://mcp.llmbase.ai/mcp/example-service`
- **SSE Transport**: `https://mcp.llmbase.ai/sse/example-service`

#### REST API Endpoints
- **Main API**: `https://mcp.llmbase.ai/api/example-service/*`
- **Specific Actions**: `https://mcp.llmbase.ai/api/example-service/action-name`

#### Streaming Endpoints
- **Real-time Operations**: `https://mcp.llmbase.ai/stream/example-service/*`
- **Batch Processing**: `https://mcp.llmbase.ai/stream/example-service/batch`

### Examples of Future Services

#### Database Service
- **MCP**: `https://mcp.llmbase.ai/mcp/database`
- **API**: `https://mcp.llmbase.ai/api/database/query`
- **Stream**: `https://mcp.llmbase.ai/stream/database/bulk-insert`

#### File Processing Service  
- **MCP**: `https://mcp.llmbase.ai/mcp/files`
- **API**: `https://mcp.llmbase.ai/api/files/process`
- **Stream**: `https://mcp.llmbase.ai/stream/files/batch-convert`

#### AI/ML Service
- **MCP**: `https://mcp.llmbase.ai/mcp/ai`
- **API**: `https://mcp.llmbase.ai/api/ai/generate`
- **Stream**: `https://mcp.llmbase.ai/stream/ai/batch-inference`

#### Search Service
- **MCP**: `https://mcp.llmbase.ai/mcp/search`
- **API**: `https://mcp.llmbase.ai/api/search/query`
- **Stream**: `https://mcp.llmbase.ai/stream/search/bulk-index`

## MCP Client Configuration

### Claude Desktop Configuration

#### Web Fetcher (Streamable HTTP)
```json
{
  "mcpServers": {
    "web-fetcher": {
      "command": "npx",
      "args": [
        "workers-mcp",
        "run",
        "web-fetcher",
        "https://mcp.llmbase.ai/mcp/web-fetcher"
      ]
    }
  }
}
```

#### Web Fetcher (SSE Legacy)
```json
{
  "mcpServers": {
    "web-fetcher-sse": {
      "command": "npx",
      "args": [
        "workers-mcp",
        "run",
        "web-fetcher",
        "https://mcp.llmbase.ai/sse/web-fetcher"
      ]
    }
  }
}
```

#### Multiple Services Configuration
```json
{
  "mcpServers": {
    "web-fetcher": {
      "command": "npx",
      "args": ["workers-mcp", "run", "web-fetcher", "https://mcp.llmbase.ai/mcp/web-fetcher"]
    },
    "database": {
      "command": "npx", 
      "args": ["workers-mcp", "run", "database", "https://mcp.llmbase.ai/mcp/database"]
    },
    "files": {
      "command": "npx",
      "args": ["workers-mcp", "run", "files", "https://mcp.llmbase.ai/mcp/files"]
    }
  }
}
```

## Endpoint URL Structure Summary

```
https://mcp.llmbase.ai/
├── /                          # Health check & service discovery
├── /mcp/{service}             # MCP Streamable HTTP transport
├── /sse/{service}             # MCP SSE transport (legacy)
├── /api/{service}/{action}    # REST API endpoints
├── /stream/{service}/{type}   # Real-time streaming endpoints
└── /sse/stream               # Generic SSE streaming
```

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": { /* service-specific data */ },
  "timestamp": "2024-12-18T10:00:00.000Z"
}
```

### Error Response  
```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2024-12-18T10:00:00.000Z"
}
```

### Streaming Response (SSE)
```
data: {"type": "start", "timestamp": "2024-12-18T10:00:00.000Z"}

data: {"type": "progress", "completed": 1, "total": 5}

data: {"type": "result", "data": {...}}

data: {"type": "complete", "totalCompleted": 5}
```