# 🚀 Basic Usage Examples

Ready-to-use configurations and simple examples to get you started quickly.

## 📋 **Claude Desktop Configurations**

### Option 1: Hosted Service (30 seconds setup)
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

### Option 2: Local Installation  
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

### Option 3: Self-Hosted
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

## 🧪 **Test Your Setup**

### Simple Test Requests

**Test 1: Basic Website Fetch**
```
"Fetch the homepage of https://example.com and show me the title"
```

**Test 2: Markdown Conversion**  
```
"Get the content from https://news.ycombinator.com in markdown format"
```

**Test 3: Multiple URLs**
```
"Fetch content from these URLs:
- https://httpbin.org/json
- https://jsonplaceholder.typicode.com/posts/1  
- https://example.com

Show me a summary of each."
```

**Test 4: Metadata Extraction**
```
"Extract metadata from https://github.com/microsoft/typescript"
```

**Test 5: Status Check**
```
"Check if these websites are accessible:
- https://google.com
- https://example.com  
- https://httpbin.org/status/404"
```

## 📝 **Common Usage Patterns**

### Research & Analysis
```
"Research the current state of renewable energy by fetching and analyzing content from:
- https://www.irena.org/newsroom
- https://www.iea.org/news  
- https://www.renewable-ei.org/en/activities/

Provide a summary of recent developments and trends."
```

### Competitive Intelligence  
```
"Compare the pricing strategies of these SaaS companies:
- https://openai.com/pricing
- https://www.anthropic.com/pricing  
- https://cohere.com/pricing

Create a comparison table with features and prices."
```

### Content Verification
```
"Fact-check this claim by fetching information from these sources:
- https://www.who.int
- https://www.cdc.gov
- https://pubmed.ncbi.nlm.nih.gov

Claim: [your claim here]"
```

### Technical Documentation
```  
"Fetch the API documentation from:
- https://docs.github.com/en/rest
- https://developer.twitter.com/en/docs

Explain the key differences in their authentication methods."
```

## 🔍 **Troubleshooting Common Issues**

### Issue: "Command not found"
**Solution**: Make sure you have Node.js 18+ installed:
```bash
node --version  # Should be 18+
npm --version   # Should be 8+
```

### Issue: "MCP server failed to start"
**Solutions**:
1. For local: `npm install -g @llmbase/mcp-web-fetch`
2. For hosted: Check your internet connection
3. Restart Claude Desktop

### Issue: "No response from server"  
**Solutions**:
1. Test with a simple request first
2. Check if the URL is accessible
3. Try a different deployment mode

### Issue: "Rate limit exceeded"
**Solutions**:
1. Wait 1 minute and try again (hosted service)
2. Use local deployment for unlimited requests
3. Batch smaller sets of URLs

## 📊 **Expected Response Times**

| Deployment | Single URL | 5 URLs | 20 URLs |
|------------|------------|--------|---------|
| **Hosted** | <500ms | <2s | <5s |
| **Local** | <1s | <3s | <8s |  
| **Self-Hosted** | <200ms | <1s | <3s |

*Times may vary based on target website response times*

## 🎯 **Next Steps**

Once you've tested the basic functionality:

1. 📚 **Advanced Examples**: Check out [../advanced-scenarios/](../advanced-scenarios/)
2. 🔧 **Integrations**: See [../integrations/](../integrations/) for language-specific examples
3. 🚀 **Performance**: Review [../performance/](../performance/) for optimization tips
4. 📖 **Full Documentation**: Read [../../DEPLOYMENT.md](../../DEPLOYMENT.md)