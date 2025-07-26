import { createRouter } from './router';
import type { Env } from './types';

// Main application environment (extending base for main worker app)
interface MainAppEnv extends Env {
  // Add any main app specific environment variables here
}

// Create the main application
const app = createRouter();

// Export the default handler for Cloudflare Workers
export default {
  async fetch(request: Request, env: MainAppEnv, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<MainAppEnv>;

// Export the MCP servers for direct use if needed
export { WebFetcherMCPServer } from './servers/web-fetcher-server';
export type { MainAppEnv };