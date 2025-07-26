# Contributing to MCP Servers by LLM Base

Thank you for your interest in contributing to **MCP Servers by LLM Base**! This document provides guidelines and information for contributors.

## 🚀 Quick Start

1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. **Install** dependencies with `bun install`
4. **Create** a feature branch
5. **Make** your changes
6. **Test** thoroughly
7. **Submit** a pull request

## 🛠️ Development Setup

### Prerequisites

- **Bun 1.0+** or **Node.js 18+**
- **Cloudflare account** with Workers enabled
- **Git** for version control

### Local Development

```bash
# Clone your fork
git clone https://github.com/your-username/mcp-servers.git
cd mcp-servers

# Install dependencies
bun install

# Start development server
bun run dev

# In another terminal, test the endpoints
curl http://localhost:8787/
```

### Development Commands

```bash
# Development server with hot reload
bun run dev

# Build TypeScript
bun run build

# Lint code
bun run lint

# Format code
bun run format

# Deploy to Cloudflare Workers (requires setup)
bun run deploy
```

## 📋 Contribution Types

We welcome various types of contributions:

### 🐛 Bug Fixes
- Fix existing functionality
- Improve error handling
- Performance optimizations

### ✨ New Features
- Add new MCP servers
- Extend existing server capabilities
- Improve HTML processing options

### 📚 Documentation
- Update README.md
- Improve API documentation
- Add usage examples

### 🧪 Testing
- Add unit tests
- Improve integration tests
- Test edge cases

### 🔧 DevOps & Tooling
- Improve GitHub Actions workflows
- Enhance development experience
- Optimize build process

## 🎯 Adding New MCP Servers

### Step 1: Create Server Class

Create a new file in `src/servers/`:

```typescript
// src/servers/my-server.ts
import { WorkerEntrypoint } from 'cloudflare:workers';
import type { Env } from '../types';

export class MyMCPServer extends WorkerEntrypoint<Env> {
  /**
   * Description of what this method does
   * @param param1 Parameter description with type info
   * @param param2 Optional parameter description
   * @returns Description of return value
   */
  async myTool(param1: string, param2?: number) {
    // Validate inputs
    if (!param1) {
      throw new Error('param1 is required');
    }

    // Implement functionality
    const result = await this.processData(param1, param2);
    
    // Return structured response
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    };
  }

  private async processData(data: string, option?: number) {
    // Your implementation here
    return { processed: data, option };
  }
}
```

### Step 2: Register Routes

Add routes in `src/router.ts`:

```typescript
import { MyMCPServer } from './servers/my-server';

// Add to router
app.all('/mcp/my-server/*', async (c) => {
  const server = new MyMCPServer(c.executionCtx, c.env);
  const proxy = new ProxyToSelf(server);
  return proxy.fetch(c.req.raw);
});
```

### Step 3: Update Service Discovery

Update the health check endpoint in `src/router.ts`:

```typescript
{
  name: 'my-server',
  description: 'Description of what your server does',
  endpoint: '/mcp/my-server',
  sseEndpoint: '/sse/my-server',
  tools: ['myTool', 'anotherTool']
}
```

### Step 4: Add Documentation

Update relevant documentation files:
- Add usage examples to README.md
- Document endpoints in ENDPOINTS.md
- Add development notes to CLAUDE.md

## 📝 Code Style Guidelines

### TypeScript Standards

- **Strict Mode**: All code must compile with TypeScript strict mode
- **Type Safety**: Prefer interfaces over `any` types
- **Explicit Returns**: Always specify return types for public methods
- **JSDoc Comments**: Document all public methods with comprehensive JSDoc

Example:
```typescript
/**
 * Fetch website content with specified format
 * @param url The URL to fetch (must be valid HTTP/HTTPS)
 * @param format Output format: 'raw', 'markdown', or 'text'
 * @param options Additional fetch options
 * @returns Promise resolving to formatted website content
 * @throws Error if URL is invalid or fetch fails
 */
async fetchWebsite(
  url: string,
  format: 'raw' | 'markdown' | 'text' = 'markdown',
  options: WebFetchOptions = {}
): Promise<WebFetchResult> {
  // Implementation
}
```

### Naming Conventions

- **Classes**: PascalCase (`WebFetcherMCPServer`)
- **Methods**: camelCase (`fetchWebsite`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_TIMEOUT`)
- **Interfaces**: PascalCase with descriptive names (`WebFetchOptions`)
- **Files**: kebab-case (`web-fetcher-server.ts`)

### Error Handling

Always provide structured error responses:

```typescript
// Good ✅
return {
  success: false,
  error: 'Invalid URL format',
  code: 'INVALID_URL',
  url: providedUrl
};

// Bad ❌
throw new Error('Bad URL');
```

### Security Practices

- **Input Validation**: Always validate user inputs
- **URL Sanitization**: Use the existing URL validation functions
- **No Secrets**: Never commit API keys, tokens, or secrets
- **Safe Defaults**: Use secure defaults for all options

## 🧪 Testing Guidelines

### Manual Testing

Before submitting a PR:

1. **Build Test**: `bun run build` succeeds
2. **Lint Test**: `bun run lint` passes
3. **Format Test**: Code is properly formatted
4. **Integration Test**: Test with Claude Desktop or curl
5. **Edge Cases**: Test error conditions and invalid inputs

### Testing Endpoints

```bash
# Health check
curl http://localhost:8787/

# Test your new server
curl -X POST http://localhost:8787/api/my-server/action \
  -H "Content-Type: application/json" \
  -d '{"param1": "test"}'

# Test MCP integration
curl -X POST http://localhost:8787/mcp/my-server \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "myTool", "params": {"param1": "test"}}'
```

### Adding Tests

If adding test files:

```typescript
// tests/my-server.test.ts
import { describe, test, expect } from 'bun:test';
import { MyMCPServer } from '../src/servers/my-server';

describe('MyMCPServer', () => {
  test('myTool validates inputs', async () => {
    const server = new MyMCPServer({} as any, {} as any);
    
    await expect(server.myTool('')).rejects.toThrow('param1 is required');
  });

  test('myTool processes data correctly', async () => {
    const server = new MyMCPServer({} as any, {} as any);
    const result = await server.myTool('test data');
    
    expect(result.success).toBe(true);
    expect(result.data.processed).toBe('test data');
  });
});
```

## 📤 Pull Request Process

### Before Submitting

- [ ] Code compiles without errors (`bun run build`)
- [ ] Linting passes (`bun run lint`)
- [ ] Code is formatted (`bun run format`)
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] No sensitive data committed

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update
- [ ] Other (please describe):

## Testing
- [ ] Manual testing completed
- [ ] Edge cases tested
- [ ] Integration tested with Claude Desktop
- [ ] No regression in existing functionality

## Screenshots
If applicable, add screenshots or terminal output.

## Additional Notes
Any additional information or context.
```

### Review Process

1. **Automated Checks**: CI workflows must pass
2. **Code Review**: At least one maintainer review required
3. **Testing**: Functionality verified by reviewer
4. **Documentation**: Check that docs are updated appropriately

## 🚨 Security & Responsible Disclosure

### Reporting Security Issues

**DO NOT** create public GitHub issues for security vulnerabilities.

Instead:
1. Email security concerns to [security@llmbase.ai]
2. Include detailed description and reproduction steps
3. Allow reasonable time for fix before public disclosure

### Security Considerations

When contributing:
- **Never expose** internal services or private networks
- **Validate all inputs** thoroughly
- **Use HTTPS** for all external requests
- **Follow OWASP** guidelines for web applications

## 📖 Documentation Standards

### Code Documentation

All public methods must have JSDoc comments:

```typescript
/**
 * Brief one-line description
 * 
 * Longer description if needed, explaining the purpose,
 * behavior, and any important details.
 * 
 * @param param1 Description of parameter
 * @param options Optional configuration object
 * @returns Description of return value
 * @throws Error conditions and when they occur
 * @example
 * ```typescript
 * const result = await server.myMethod('example', { timeout: 5000 });
 * console.log(result.data);
 * ```
 */
```

### API Documentation

When adding new endpoints, update `ENDPOINTS.md`:

```markdown
#### My New Endpoint
- **URL**: `https://mcp.llmbase.ai/api/my-server/action`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Body**:
```json
{
  "param1": "required string",
  "param2": 42  // optional number
}
```

**Response**:
```json
{
  "success": true,
  "data": { "result": "processed data" }
}
```
```

## 🏷️ Issue Labels

When creating issues, use appropriate labels:

- `bug` - Something isn't working
- `enhancement` - New feature or improvement
- `documentation` - Improvements to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `question` - Further information is requested

## 💬 Community & Support

### Getting Help

- **GitHub Discussions**: For general questions
- **GitHub Issues**: For bugs and feature requests
- **Discord**: [Community Discord server]
- **Documentation**: Check CLAUDE.md for development context

### Code of Conduct

Please be respectful and constructive in all interactions. We follow standard open source community guidelines:

- Be welcoming to newcomers
- Be respectful of differing viewpoints
- Focus on what is best for the community
- Show empathy towards other community members

## 🎖️ Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes for significant contributions
- README.md acknowledgments section

## 📞 Questions?

If you have questions about contributing:

1. Check existing issues and discussions
2. Review this contributing guide
3. Look at recent PRs for examples
4. Ask in GitHub Discussions
5. Create a new issue with the `question` label

---

**Thank you for contributing to MCP Servers by LLM Base!** 🚀