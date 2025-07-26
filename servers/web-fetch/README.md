# @llmbase/mcp-web-fetch

A versatile MCP server for web content fetching and processing. Supports **three deployment modes** to suit different needs:

1. **🏠 Local Execution** - Run directly on your machine
2. **🔧 Self-Hosted** - Deploy on your own Cloudflare Workers account  
3. **☁️ Hosted Service** - Use our managed service at mcp.llmbase.ai

## Features

- **Multi-format Output**: Raw HTML, Markdown, or plain text
- **Batch Processing**: Fetch multiple URLs concurrently
- **Smart HTML Processing**: Uses Turndown.js for clean markdown conversion
- **Metadata Extraction**: Extract titles, descriptions, and meta tags
- **Security Built-in**: Blocks localhost/private IPs, configurable timeouts
- **Edge Performance**: Global distribution via Cloudflare Workers (hosted modes)

## Installation & Setup

### 🏠 Local Execution (Recommended for Development)

Install the package locally and run as a traditional MCP server:

```bash
npm install @llmbase/mcp-web-fetch
```

**Claude Desktop Configuration:**

```json
{
  "mcpServers": {
    "web-fetcher": {
      "command": "npx",
      "args": ["@llmbase/mcp-web-fetch"]
    }
  }
}
```

Or if installed globally:

```bash
npm install -g @llmbase/mcp-web-fetch
```

```json
{
  "mcpServers": {
    "web-fetcher": {
      "command": "mcp-web-fetch"
    }
  }
}
```

### 🔧 Self-Hosted (Your Own Cloudflare Account)

Deploy to your own Cloudflare Workers account for edge performance:

1. **Clone the deployment template:**
```bash
git clone https://github.com/llmbaseai/mcp-servers.git
cd mcp-servers/templates
```

2. **Copy template files to your project:**
```bash
cp package.example.json package.json
cp wrangler.example.jsonc wrangler.jsonc
cp index.example.ts src/index.ts
cp tsconfig.example.json tsconfig.json
```

3. **Install dependencies:**
```bash
npm install
```

4. **Configure wrangler.jsonc** with your settings and deploy:
```bash
npm run deploy
```

5. **Use in Claude Desktop:**
```json
{
  "mcpServers": {
    "web-fetcher": {
      "command": "npx",
      "args": [
        "workers-mcp", 
        "run", 
        "web-fetcher",
        "https://your-worker.your-subdomain.workers.dev/mcp/web-fetch"
      ]
    }
  }
}
```

### ☁️ Hosted Service (Easiest Setup)

Use our managed service - no setup required:

```json
{
  "mcpServers": {
    "web-fetcher": {
      "command": "npx",
      "args": [
        "workers-mcp", 
        "run", 
        "web-fetcher",
        "https://mcp.llmbase.ai/mcp/web-fetch"
      ]
    }
  }
}
```

## Available Tools

### `fetchWebsite`
Fetch a website and return its content in your preferred format.

**Parameters:**
- `url` (required): The URL to fetch
- `format`: Output format - `'raw'`, `'markdown'`, or `'text'` (default: `'markdown'`)
- `followRedirects`: Follow HTTP redirects (default: `true`)
- `timeout`: Timeout in milliseconds (default: `30000`)
- `userAgent`: Custom user agent string
- `headers`: Additional headers as key-value pairs

### `fetchMultipleWebsites`
Fetch multiple websites concurrently with progress tracking.

**Parameters:**
- `urls` (required): Array of URLs to fetch
- `format`: Output format (default: `'markdown'`)
- `maxConcurrent`: Maximum concurrent requests (default: `5`)
- `followRedirects`: Follow HTTP redirects (default: `true`)
- `timeout`: Timeout per request in milliseconds (default: `30000`)

### `extractWebsiteMetadata`
Extract metadata from a website without downloading the full content.

**Parameters:**
- `url` (required): The URL to analyze

### `checkWebsiteStatus`
Check if a URL is accessible without downloading the content.

**Parameters:**
- `url` (required): The URL to check

## Deployment Comparison

| Feature | Local | Self-Hosted | Hosted Service |
|---------|-------|-------------|----------------|
| **Setup Complexity** | Minimal | Moderate | None |
| **Performance** | Local CPU | Global Edge | Global Edge |
| **Privacy** | Complete | Your control | Shared service |
| **Cost** | Free | CF Workers pricing | Free |
| **Maintenance** | You | You | Us |
| **Custom Domain** | N/A | ✅ | ❌ |
| **SLA** | None | Your setup | Best effort |

## Security Features

- **URL Validation**: Blocks localhost and private IP ranges
- **Request Limits**: Configurable timeouts and concurrency limits  
- **Content Filtering**: Removes scripts and potentially harmful content
- **Rate Limiting**: Built-in protection against abuse

## Development

### Local Development
```bash
git clone https://github.com/llmbaseai/mcp-servers.git
cd mcp-servers/servers/web-fetch
npm install
npm run build
npm link
```

### Testing Locally
```bash
# Test the CLI directly
echo '{"method": "tools/list"}' | node dist/cli.js

# Or use with Claude Desktop using the local configuration above
```

## Contributing

See the main [repository](https://github.com/llmbaseai/mcp-servers) for contribution guidelines.

## License

MIT - see LICENSE file for details.