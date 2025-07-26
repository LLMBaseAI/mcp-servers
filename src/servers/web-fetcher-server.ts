import { WorkerEntrypoint } from 'cloudflare:workers';
import type { Env, WebFetchOptions } from '../types';
import { WebFetcher } from '../services/web-fetcher';

export class WebFetcherMCPServer extends WorkerEntrypoint<Env> {
  private webFetcher: WebFetcher;

  constructor(ctx: ExecutionContext, env: Env) {
    super(ctx, env);
    this.webFetcher = new WebFetcher();
  }

  /**
   * Fetch a website and return its content as raw text, markdown, or plain text.
   * 
   * @param url The URL to fetch
   * @param format The format to return the content in ('raw', 'markdown', 'text')
   * @param followRedirects Whether to follow HTTP redirects
   * @param timeout Timeout in milliseconds (default: 30000)
   * @param userAgent Custom user agent string
   * @param headers Additional headers to send with the request
   * @returns The website content and metadata
   */
  async fetchWebsite(
    url: string,
    format: 'raw' | 'markdown' | 'text' = 'markdown',
    followRedirects: boolean = true,
    timeout: number = 30000,
    userAgent?: string,
    headers?: Record<string, string>
  ) {
    const options: WebFetchOptions = {
      url,
      format,
      followRedirects,
      timeout,
      userAgent,
      headers
    };

    try {
      const result = await this.webFetcher.fetchWebsite(options);
      
      return {
        success: true,
        data: {
          content: result.content,
          title: result.title,
          url: result.url,
          finalUrl: result.finalUrl,
          contentType: result.contentType,
          statusCode: result.statusCode,
          format,
          fetchedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        url
      };
    }
  }

  /**
   * Fetch multiple websites concurrently.
   * 
   * @param urls Array of URLs to fetch
   * @param format The format to return the content in
   * @param maxConcurrent Maximum number of concurrent requests (default: 5)
   * @param followRedirects Whether to follow HTTP redirects
   * @param timeout Timeout in milliseconds per request
   * @returns Array of website contents and metadata
   */
  async fetchMultipleWebsites(
    urls: string[],
    format: 'raw' | 'markdown' | 'text' = 'markdown',
    maxConcurrent: number = 5,
    followRedirects: boolean = true,
    timeout: number = 30000
  ) {
    if (urls.length === 0) {
      return {
        success: false,
        error: 'No URLs provided'
      };
    }

    if (urls.length > 20) {
      return {
        success: false,
        error: 'Too many URLs. Maximum 20 URLs allowed per request.'
      };
    }

    try {
      // Process URLs in batches to respect concurrency limits
      const results = [];
      for (let i = 0; i < urls.length; i += maxConcurrent) {
        const batch = urls.slice(i, i + maxConcurrent);
        const batchResults = await this.webFetcher.fetchMultiple(batch, {
          format,
          followRedirects,
          timeout
        });
        results.push(...batchResults);
      }

      return {
        success: true,
        data: results.map((result, index) => ({
          url: urls[index],
          success: result.statusCode >= 200 && result.statusCode < 400,
          content: result.content,
          title: result.title,
          finalUrl: result.finalUrl,
          contentType: result.contentType,
          statusCode: result.statusCode,
          error: (result as any).error || null
        })),
        summary: {
          totalRequested: urls.length,
          successful: results.filter(r => r.statusCode >= 200 && r.statusCode < 400).length,
          failed: results.filter(r => r.statusCode < 200 || r.statusCode >= 400).length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Extract metadata from a website without downloading the full content.
   * 
   * @param url The URL to analyze
   * @returns Website metadata including title, description, and other meta tags
   */
  async extractWebsiteMetadata(url: string) {
    try {
      const result = await this.webFetcher.fetchWebsite({
        url,
        format: 'raw',
        timeout: 15000
      });

      const metadata = await this.webFetcher.extractMetadata(result.content);

      return {
        success: true,
        data: {
          url: result.url,
          finalUrl: result.finalUrl,
          title: result.title,
          statusCode: result.statusCode,
          contentType: result.contentType,
          metadata,
          fetchedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        url
      };
    }
  }

  /**
   * Check if a URL is accessible without downloading the content.
   * 
   * @param url The URL to check
   * @returns Status information about the URL
   */
  async checkWebsiteStatus(url: string) {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CloudflareWorker-MCP/1.0)'
        },
        redirect: 'follow'
      });

      return {
        success: true,
        data: {
          url,
          finalUrl: response.url,
          statusCode: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length'),
          lastModified: response.headers.get('last-modified'),
          server: response.headers.get('server'),
          accessible: response.ok,
          checkedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        url
      };
    }
  }
}