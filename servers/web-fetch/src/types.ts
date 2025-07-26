import type { BaseEnv } from '@llmbase/mcp-shared';

export interface WebFetcherEnv extends BaseEnv {
  // Add any web-fetcher specific environment variables here
}

export interface WebFetchOptions {
  url: string;
  format?: 'raw' | 'markdown' | 'text';
  followRedirects?: boolean;
  timeout?: number;
  userAgent?: string;
  headers?: Record<string, string>;
}

export interface WebFetchResult {
  content: string;
  contentType: string;
  url: string;
  title?: string;
  statusCode: number;
  finalUrl: string;
}

export interface HTMLProcessorOptions {
  removeScripts?: boolean;
  removeStyles?: boolean;
  preserveLinks?: boolean;
  baseUrl?: string;
}