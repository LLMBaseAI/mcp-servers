# MCP Servers Deployment Guide

This guide covers all three deployment modes for our MCP servers in detail.

## 🏠 Local Execution

### Overview
Run MCP servers directly on your local machine using Node.js. Best for development, maximum privacy, and when you need full control over the execution environment.

### Prerequisites
- Node.js 18+ 
- npm or bun

### Setup

1. **Install individual server packages:**
```bash
npm install @llmbase/mcp-web-fetch
# Or globally for easier CLI access
npm install -g @llmbase/mcp-web-fetch
```

2. **Configure Claude Desktop:**
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

3. **Test the installation:**
```bash
# Test CLI directly
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | npx @llmbase/mcp-web-fetch

# Or if installed globally
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | mcp-web-fetch
```

### Troubleshooting Local
- **Permission errors**: Try installing globally with `npm install -g`
- **Module not found**: Ensure Node.js 18+ is installed
- **Claude can't connect**: Check that the command path is correct in your config

---

## 🔧 Self-Hosted Deployment  

### Overview
Deploy to your own Cloudflare Workers account for edge performance with full control. Best for production use when you want global performance but maintain control.

### Prerequisites
- Cloudflare account (free tier works)
- Node.js 18+
- Wrangler CLI

### Setup

1. **Create your deployment project:**
```bash
mkdir my-mcp-servers
cd my-mcp-servers
```

2. **Copy templates from this repo:**
```bash
# Download templates
curl -O https://raw.githubusercontent.com/llmbaseai/mcp-servers/main/templates/package.example.json
curl -O https://raw.githubusercontent.com/llmbaseai/mcp-servers/main/templates/wrangler.example.jsonc
curl -O https://raw.githubusercontent.com/llmbaseai/mcp-servers/main/templates/index.example.ts
curl -O https://raw.githubusercontent.com/llmbaseai/mcp-servers/main/templates/tsconfig.example.json

# Rename templates
mv package.example.json package.json
mv wrangler.example.jsonc wrangler.jsonc
mv tsconfig.example.json tsconfig.json
mkdir src && mv index.example.ts src/index.ts
```

3. **Install dependencies:**
```bash
npm install
```

4. **Configure Cloudflare:**
```bash
npx wrangler login
```

5. **Edit wrangler.jsonc:**
```jsonc
{
  "name": "my-mcp-servers", // Change this
  "compatibility_date": "2024-12-18",
  "vars": {
    "ENVIRONMENT": "production"
  }
  // Add your own secrets if needed
  // wrangler secret put MY_API_KEY
}
```

6. **Deploy:**
```bash
npm run build
npm run deploy

# For staging
npm run deploy:staging
```

7. **Configure Claude Desktop:**
```json
{
  "mcpServers": {
    "web-fetcher": {
      "command": "npx",
      "args": [
        "workers-mcp", 
        "run", 
        "web-fetcher",
        "https://my-mcp-servers.your-subdomain.workers.dev/mcp/web-fetch"
      ]
    }
  }
}
```

### Custom Domain Setup

1. **Add domain in Cloudflare:**
- Go to Workers & Pages > your-worker > Custom Domains
- Add your domain (e.g., mcp.yourdomain.com)

2. **Update wrangler.jsonc:**
```jsonc
{
  "routes": [
    { 
      "pattern": "mcp.yourdomain.com/*", 
      "custom_domain": true 
    }
  ]
}
```

3. **Update Claude config:**
```json
{
  "mcpServers": {
    "web-fetcher": {
      "command": "npx",
      "args": [
        "workers-mcp", 
        "run", 
        "web-fetcher", 
        "https://mcp.yourdomain.com/mcp/web-fetch"
      ]
    }
  }
}
```

### Environment Management

```bash
# Development
wrangler dev

# Deploy to staging
wrangler deploy --env staging

# Deploy to production  
wrangler deploy --env production

# View logs
wrangler tail

# Add your own secrets if needed
# wrangler secret put MY_API_KEY --env production
```

### Troubleshooting Self-Hosted
- **Deployment fails**: Check `wrangler.jsonc` syntax and account permissions
- **500 errors**: Check wrangler logs with `wrangler tail`
- **CORS issues**: Ensure CORS headers are properly set in your worker
- **Domain issues**: Verify DNS is pointing to Cloudflare

---

## ☁️ Hosted Service

### Overview
Use our managed service at mcp.llmbase.ai. No setup required, maintained by our team.

### Setup

Simply configure Claude Desktop:

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

### Service Limits
- **Rate limiting**: 100 requests/minute per IP
- **Timeout**: 30 seconds per request
- **Concurrent**: 5 requests per client
- **URL limits**: No localhost/private IPs

### Troubleshooting Hosted
- **Rate limit errors**: Wait a minute and try again
- **Timeout errors**: Try with smaller/faster websites
- **Service down**: Check our status page or use local/self-hosted alternatives

---

## 🔄 Migration Between Modes

### Local → Self-Hosted
1. Follow self-hosted setup above
2. Update Claude Desktop config with your worker URL
3. Test functionality

### Self-Hosted → Local  
1. Install packages locally: `npm install @llmbase/mcp-web-fetch`
2. Update Claude Desktop config to use local command
3. Test functionality

### Hosted → Self-Hosted/Local
1. Follow respective setup guides above
2. Update Claude Desktop config 
3. Test functionality

---

## 🔧 Advanced Configuration

### Adding Multiple Servers
```json
{
  "mcpServers": {
    "web-fetcher": {
      "command": "npx",
      "args": ["@llmbase/mcp-web-fetch"] 
    },
    "web-fetcher-hosted": {
      "command": "npx",
      "args": [
        "workers-mcp",
        "run", 
        "backup-fetcher",
        "https://mcp.llmbase.ai/mcp/web-fetch"
      ]
    }
  }
}
```

### Custom Environment Variables
For self-hosted deployments, you can customize behavior:

```jsonc
// wrangler.jsonc
{
  "vars": {
    "ENVIRONMENT": "production",
    "DEFAULT_TIMEOUT": "30000",
    "MAX_CONCURRENT": "5",
    "ALLOWED_DOMAINS": "example.com,mysite.org"
  }
}
```

### Monitoring & Logging

**Local**: Check console output and Node.js logs
**Self-Hosted**: Use `wrangler tail` and Cloudflare Analytics
**Hosted**: Limited to request-level information

---

## 🆘 Support & Troubleshooting

### Common Issues
1. **Claude can't find MCP server**: Check command path and args
2. **Permission denied**: Try running with `sudo npm install -g`
3. **Network errors**: Check firewall and proxy settings
4. **Worker deployment fails**: Verify Cloudflare account permissions

### Getting Help
- **Issues**: https://github.com/llmbaseai/mcp-servers/issues
- **Discussions**: https://github.com/llmbaseai/mcp-servers/discussions
- **Documentation**: https://mcp.llmbase.ai/docs

### Performance Optimization
- **Local**: Use SSD storage, sufficient RAM
- **Self-Hosted**: Choose closest Cloudflare region
- **Hosted**: Use batch requests for multiple URLs

---

## 🔒 Security Best Practices

### All Modes
- Keep packages updated
- Use HTTPS URLs only
- Validate input URLs

### Self-Hosted Additional
- Enable rate limiting
- Monitor usage logs  
- Use custom domains with SSL
- Add your own authentication if needed

### Local Additional  
- Run with limited user privileges
- Keep Node.js updated
- Consider containerization for isolation