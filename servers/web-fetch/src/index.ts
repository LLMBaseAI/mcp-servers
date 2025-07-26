// For Cloudflare Workers / hosted usage
export { WebFetcherMCPServer } from './web-fetcher-server.js';
export { WebFetcher } from './services/web-fetcher.js';
export { HTMLProcessor } from './utils/html-processor.js';
export type { WebFetchOptions, WebFetchResult, WebFetcherEnv } from './types.js';

// For local MCP usage - note: CLI is in separate file to avoid Node.js imports in browser/worker code