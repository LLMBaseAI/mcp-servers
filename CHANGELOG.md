# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release preparation
- Comprehensive documentation

### Changed
- Nothing yet

### Deprecated
- Nothing yet

### Removed
- Nothing yet

### Fixed
- Nothing yet

### Security
- Nothing yet

## [1.0.0] - 2024-12-18

### Added
- **Web Fetcher MCP Server** with full feature set
  - Fetch websites as HTML, Markdown, or plain text
  - Batch processing with real-time progress via SSE
  - Website metadata extraction
  - Website status checking
  - Security features (IP blocking, timeout handling)

- **Architecture & Framework**
  - Hono.js-based routing with Cloudflare Workers
  - TypeScript with strict mode for type safety
  - Multiple transport support (Streamable HTTP + SSE)
  - Scalable design for hosting multiple MCP servers

- **HTML Processing**
  - Turndown.js for HTML to Markdown conversion
  - HTMLRewriter for Cloudflare-native processing
  - Plain text extraction with tag stripping
  - Configurable processing options

- **API Endpoints**
  - RESTful API for direct HTTP access
  - Streaming endpoints for batch operations
  - MCP-compliant transport endpoints
  - Health check and service discovery

- **Documentation**
  - Comprehensive README with usage examples
  - Complete API reference (ENDPOINTS.md)
  - Development guide for contributors (CLAUDE.md)
  - Publishing and deployment instructions

- **Development Experience**
  - ESLint and Prettier configuration
  - GitHub Actions for CI/CD
  - Automatic npm publishing workflow
  - Docker support for local development

### Changed
- Project renamed from "Cloudflare MCP Servers" to "MCP Servers by LLM Base"
- npm package name: `@llmbase/mcp-servers`
- Repository moved to `https://github.com/llmbaseai/mcp-servers`

### Technical Details
- **Host**: https://mcp.llmbase.ai
- **Framework**: Hono.js v4.6+
- **Runtime**: Cloudflare Workers
- **Language**: TypeScript 5.7+
- **Dependencies**: workers-mcp v0.0.13, turndown v7.2.0

### Security Features
- URL validation and sanitization
- Private IP and localhost blocking
- Configurable request timeouts
- CORS support with proper headers
- Content-Type validation

### MCP Integration
- Compatible with Claude Desktop
- Support for Cursor, Windsurf, and other MCP clients
- JSON-RPC 2.0 protocol compliance
- Session management for SSE transport

---

## Release Template

### [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Now removed features

### Fixed
- Bug fixes

### Security
- Vulnerability fixes