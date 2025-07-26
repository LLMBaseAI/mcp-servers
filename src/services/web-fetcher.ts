import type { WebFetchOptions, WebFetchResult } from '../types';
import { HTMLProcessor } from '../utils/html-processor';

export class WebFetcher {
  private htmlProcessor: HTMLProcessor;
  private defaultTimeout = 30000; // 30 seconds
  private defaultUserAgent = 'Mozilla/5.0 (compatible; CloudflareWorker-MCP/1.0)';

  constructor() {
    this.htmlProcessor = new HTMLProcessor();
  }

  /**
   * Fetch a website and return the content in the specified format
   */
  async fetchWebsite(options: WebFetchOptions): Promise<WebFetchResult> {
    const {
      url,
      format = 'markdown',
      followRedirects = true,
      timeout = this.defaultTimeout,
      userAgent = this.defaultUserAgent,
      headers = {}
    } = options;

    // Validate URL
    if (!this.isValidUrl(url)) {
      throw new Error(`Invalid URL: ${url}`);
    }

    try {
      // Prepare request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const requestHeaders = {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        ...headers
      };

      const response = await fetch(url, {
        method: 'GET',
        headers: requestHeaders,
        redirect: followRedirects ? 'follow' : 'manual',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || 'text/html';
      const finalUrl = response.url;

      // Check if content is HTML
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        // Return raw content for non-HTML files
        const content = await response.text();
        return {
          content,
          contentType,
          url: finalUrl,
          statusCode: response.status,
          finalUrl
        };
      }

      const html = await response.text();
      const title = this.htmlProcessor.extractTitle(html);

      let content: string;
      switch (format) {
        case 'raw':
          content = html;
          break;
        case 'text':
          content = this.htmlProcessor.htmlToPlainText(html);
          break;
        case 'markdown':
        default:
          content = this.htmlProcessor.htmlToMarkdown(html, {
            removeScripts: true,
            removeStyles: true,
            preserveLinks: true,
            baseUrl: finalUrl
          });
          break;
      }

      return {
        content,
        contentType,
        url: finalUrl,
        title,
        statusCode: response.status,
        finalUrl
      };

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeout}ms`);
        }
        throw new Error(`Failed to fetch ${url}: ${error.message}`);
      }
      throw new Error(`Failed to fetch ${url}: Unknown error`);
    }
  }

  /**
   * Fetch multiple websites concurrently
   */
  async fetchMultiple(urls: string[], options: Omit<WebFetchOptions, 'url'> = {}): Promise<WebFetchResult[]> {
    const fetchPromises = urls.map(url => 
      this.fetchWebsite({ ...options, url }).catch(error => ({
        content: '',
        contentType: 'text/plain',
        url,
        statusCode: 0,
        error: error.message
      } as WebFetchResult & { error: string }))
    );

    return Promise.all(fetchPromises);
  }

  /**
   * Check if a URL is valid and safe to fetch
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      
      // Only allow HTTP and HTTPS
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return false;
      }

      // Block localhost and private IP ranges for security
      const hostname = parsedUrl.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname.startsWith('127.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        /^172\.(1[6-9]|2[0-9]|3[01])\./.test(hostname) ||
        hostname.endsWith('.local') ||
        hostname === '::1' ||
        /^fe80:/i.test(hostname)
      ) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract metadata from HTML
   */
  async extractMetadata(html: string): Promise<Record<string, string>> {
    const metadata: Record<string, string> = {};

    // Extract common meta tags
    const metaMatches = html.matchAll(/<meta\s+([^>]+)>/gi);
    for (const match of metaMatches) {
      const attrs = match[1];
      if (!attrs) continue;
      
      const nameMatch = attrs.match(/name=['"]([^'"]+)['"]/i);
      const propertyMatch = attrs.match(/property=['"]([^'"]+)['"]/i);
      const contentMatch = attrs.match(/content=['"]([^'"]*)['"]/i);

      if (contentMatch && contentMatch[1] !== undefined) {
        const content = contentMatch[1];
        if (nameMatch && nameMatch[1]) {
          metadata[nameMatch[1]] = content;
        } else if (propertyMatch && propertyMatch[1]) {
          metadata[propertyMatch[1]] = content;
        }
      }
    }

    return metadata;
  }
}