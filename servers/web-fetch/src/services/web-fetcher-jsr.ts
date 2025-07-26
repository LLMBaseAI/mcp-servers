// JSR-compatible web fetcher service without external dependencies
import type { WebFetchOptions, WebFetchResult, WebsiteMetadata } from '../types';
import { HTMLProcessor } from '../utils/html-processor-jsr';

export class WebFetcher {
  private htmlProcessor: HTMLProcessor;

  constructor() {
    this.htmlProcessor = new HTMLProcessor();
  }

  /**
   * Validate URL to prevent SSRF attacks
   */
  private validateUrl(url: string): URL {
    let parsedUrl: URL;
    
    try {
      parsedUrl = new URL(url);
    } catch (error) {
      throw new Error(`Invalid URL format: ${url}`);
    }

    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error(`Unsupported protocol: ${parsedUrl.protocol}. Only HTTP and HTTPS are allowed.`);
    }

    // Block localhost and private IP ranges
    const hostname = parsedUrl.hostname.toLowerCase();
    
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      throw new Error('Localhost URLs are not allowed');
    }

    // Block private IP ranges (basic check)
    if (hostname.match(/^10\./) || hostname.match(/^192\.168\./) || hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) || hostname.match(/^169\.254\./)) {
      throw new Error('Private IP addresses are not allowed');
    }

    return parsedUrl;
  }

  /**
   * Fetch a single website
   */
  async fetchWebsite(options: WebFetchOptions): Promise<WebFetchResult> {
    const validatedUrl = this.validateUrl(options.url);
    const startTime = Date.now();

    const requestHeaders: Record<string, string> = {
      'User-Agent': options.userAgent || 'Mozilla/5.0 (compatible; CloudflareWorker-MCP/1.0)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      ...options.headers
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

      const response = await fetch(validatedUrl.toString(), {
        method: 'GET',
        headers: requestHeaders,
        redirect: options.followRedirects !== false ? 'follow' : 'manual',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok && response.status >= 400) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      
      // Only process HTML content
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        throw new Error(`Unsupported content type: ${contentType}. Only HTML content is supported.`);
      }

      const rawContent = await response.text();
      const title = this.htmlProcessor.extractTitle(rawContent);
      
      let processedContent: string;
      
      switch (options.format) {
        case 'raw':
          processedContent = rawContent;
          break;
        case 'text':
          processedContent = this.htmlProcessor.htmlToPlainText(rawContent);
          break;
        case 'markdown':
        default:
          processedContent = this.htmlProcessor.htmlToMarkdown(rawContent);
          break;
      }

      const result: WebFetchResult = {
        content: processedContent,
        title: title,
        url: options.url,
        finalUrl: response.url,
        contentType,
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        fetchTime: Date.now() - startTime
      };

      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${options.timeout || 30000}ms`);
      }
      
      throw error instanceof Error ? error : new Error('Unknown error occurred during fetch');
    }
  }

  /**
   * Fetch multiple websites with controlled concurrency
   */
  async fetchMultiple(
    urls: string[], 
    options: Omit<WebFetchOptions, 'url'> = {}
  ): Promise<WebFetchResult[]> {
    const maxConcurrent = 5; // Hard limit for safety
    const results: WebFetchResult[] = [];
    
    // Process URLs in chunks to control concurrency
    for (let i = 0; i < urls.length; i += maxConcurrent) {
      const chunk = urls.slice(i, i + maxConcurrent);
      const chunkPromises = chunk.map(async (url) => {
        try {
          return await this.fetchWebsite({ ...options, url });
        } catch (error) {
          // Return error result instead of throwing
          return {
            content: '',
            title: '',
            url,
            finalUrl: url,
            contentType: '',
            statusCode: 0,
            headers: {},
            fetchTime: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          } as WebFetchResult;
        }
      });
      
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }
    
    return results;
  }

  /**
   * Extract metadata from HTML content
   */
  async extractMetadata(html: string): Promise<WebsiteMetadata> {
    const metadata: WebsiteMetadata = {
      title: this.htmlProcessor.extractTitle(html),
      description: '',
      keywords: '',
      author: '',
      robots: '',
      canonical: '',
      openGraph: {},
      twitterCard: {},
      structuredData: []
    };

    // Extract meta tags
    const metaRegex = /<meta[^>]*>/gi;
    const metaTags = html.match(metaRegex) || [];

    for (const metaTag of metaTags) {
      const nameMatch = metaTag.match(/name=["']([^"']+)["']/i);
      const propertyMatch = metaTag.match(/property=["']([^"']+)["']/i);
      const contentMatch = metaTag.match(/content=["']([^"']+)["']/i);

      if (!contentMatch) continue;

      const content = contentMatch[1];

      if (nameMatch && nameMatch[1]) {
        const name = nameMatch[1].toLowerCase();
        switch (name) {
          case 'description':
            metadata.description = content;
            break;
          case 'keywords':
            metadata.keywords = content;
            break;
          case 'author':
            metadata.author = content;
            break;
          case 'robots':
            metadata.robots = content;
            break;
        }
      }

      if (propertyMatch && propertyMatch[1] && contentMatch && contentMatch[1]) {
        const property = propertyMatch[1];
        if (property.startsWith('og:')) {
          metadata.openGraph[property] = contentMatch[1];
        } else if (property.startsWith('twitter:')) {
          metadata.twitterCard[property] = contentMatch[1];
        }
      }
    }

    // Extract canonical URL
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
    if (canonicalMatch && canonicalMatch[1]) {
      metadata.canonical = canonicalMatch[1];
    }

    // Extract JSON-LD structured data (basic extraction)
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
    let jsonLdMatch;
    while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
      try {
        if (jsonLdMatch[1]) {
          const jsonData = JSON.parse(jsonLdMatch[1]);
          metadata.structuredData.push(jsonData);
        }
      } catch (error) {
        // Ignore invalid JSON-LD
      }
    }

    return metadata;
  }
}