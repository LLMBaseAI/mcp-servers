# 📚 MCP Server Examples & Use Cases

This directory contains practical examples, real-world use cases, and integration guides for our MCP servers.

## 🚀 **Quick Examples**

### Basic Usage
- [**Claude Desktop Setup**](basic-usage/) - Ready-to-use configurations
- [**First Requests**](basic-usage/) - Test your installation
- [**Common Patterns**](basic-usage/) - Typical usage scenarios

### Advanced Scenarios  
- [**Competitive Research**](advanced-scenarios/competitive-research/) - Monitor competitors at scale
- [**Content Analysis**](advanced-scenarios/content-analysis/) - Research and fact-checking workflows
- [**Batch Processing**](advanced-scenarios/batch-processing/) - Handle large URL lists efficiently
- [**API Documentation**](advanced-scenarios/api-docs/) - Extract and analyze API documentation

### Integrations
- [**Python Client**](integrations/python/) - Use with Python applications
- [**Node.js Wrapper**](integrations/nodejs/) - JavaScript/TypeScript integration
- [**Curl Examples**](integrations/curl/) - Direct HTTP API usage
- [**Postman Collection**](integrations/postman/) - Ready-to-import API collection

## 🎯 **By Use Case**

| Use Case | Example | Deployment Mode | Difficulty |
|----------|---------|-----------------|------------|
| 📊 **Research** | [Multi-source analysis](advanced-scenarios/research/) | Any | Beginner |
| 🔍 **Competitive Intel** | [Price monitoring](advanced-scenarios/competitive-research/) | Self-hosted | Intermediate |
| 📈 **Content Creation** | [Source gathering](advanced-scenarios/content-analysis/) | Local/Hosted | Beginner |
| 🛠️ **Development** | [API testing](integrations/) | Local | Intermediate |
| 📋 **Due Diligence** | [Company research](advanced-scenarios/research/) | Any | Beginner |
| 🎨 **Web Scraping** | [Batch extraction](advanced-scenarios/batch-processing/) | Self-hosted | Advanced |

## 🏃‍♂️ **Quick Start Examples**

### 1. Basic Website Fetch
```json
// Claude Desktop: Fetch a single page
"Fetch https://news.ycombinator.com as markdown"
```

### 2. Competitive Analysis
```json
// Claude Desktop: Compare multiple competitors
"Fetch the pricing pages from these URLs and create a comparison table:
- https://competitor1.com/pricing  
- https://competitor2.com/pricing
- https://competitor3.com/pricing"
```

### 3. Research Multiple Sources
```json
// Claude Desktop: Gather research material
"Research the latest developments in AI by fetching content from:
- https://arxiv.org/list/cs.AI/recent
- https://ai.googleblog.com
- https://openai.com/blog
- https://www.anthropic.com/news

Summarize the key trends and breakthroughs."
```

## 🛠️ **Developer Examples**

### Testing Your Setup
```bash
# Test local installation
npx @llmbase/mcp-web-fetch << 'EOF'
{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}
EOF

# Test hosted service  
curl -X POST https://mcp.llmbase.ai/mcp/web-fetch \
  -H "Content-Type: application/json" \
  -d '{"method": "fetchWebsite", "params": {"url": "https://example.com"}}'
```

### Performance Testing
```bash
# Batch processing test
time npx @llmbase/mcp-web-fetch << 'EOF'
{
  "jsonrpc": "2.0", 
  "id": 1, 
  "method": "tools/call",
  "params": {
    "name": "fetchMultipleWebsites",
    "arguments": {
      "urls": [
        "https://example.com",
        "https://httpbin.org/delay/1", 
        "https://jsonplaceholder.typicode.com"
      ]
    }
  }
}
EOF
```

## 📖 **Directory Structure**

```
examples/
├── README.md                          # This file
├── basic-usage/                       # Simple examples
│   ├── README.md                     
│   ├── claude-configs/               # Ready-to-use Claude Desktop configs
│   ├── first-requests/               # Test your installation  
│   └── common-patterns/              # Typical usage scenarios
├── advanced-scenarios/               # Real-world use cases
│   ├── README.md
│   ├── competitive-research/         # Monitor competitors
│   ├── content-analysis/             # Research workflows
│   ├── batch-processing/             # Large-scale fetching
│   └── api-documentation/            # Extract API docs
├── integrations/                     # Language & tool integrations  
│   ├── README.md
│   ├── python/                       # Python client examples
│   ├── nodejs/                       # Node.js/JavaScript examples  
│   ├── curl/                         # Direct HTTP examples
│   └── postman/                      # Postman collections
└── performance/                      # Benchmarks & load testing
    ├── README.md
    ├── benchmarks/                   # Performance comparisons
    └── load-testing/                 # Stress testing examples
```

## 🆘 **Need Help?**

- 📚 **Documentation**: [../DEPLOYMENT.md](../DEPLOYMENT.md)
- 🐛 **Issues**: [GitHub Issues](https://github.com/llmbaseai/mcp-servers/issues)  
- 💬 **Discussions**: [GitHub Discussions](https://github.com/llmbaseai/mcp-servers/discussions)
- 🌐 **Live Demo**: [https://mcp.llmbase.ai](https://mcp.llmbase.ai)

## 🤝 **Contributing Examples**

Have a great use case or integration example? We'd love to include it!

1. Fork the repository
2. Create your example in the appropriate directory
3. Include a detailed README.md
4. Submit a pull request

See [../CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.