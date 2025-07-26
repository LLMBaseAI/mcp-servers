// JSR-compatible HTML processor without external dependencies
import type { HTMLProcessorOptions } from '../types';

export class HTMLProcessor {
  constructor(options: HTMLProcessorOptions = {}) {
    // No external dependencies needed for JSR version
  }

  /**
   * Convert HTML to clean text using HTMLRewriter (Cloudflare native)
   */
  async htmlToTextWithRewriter(html: string, options: HTMLProcessorOptions = {}): Promise<string> {
    const rewriter = new HTMLRewriter();
    let textContent = '';
    let title = '';
    
    // Extract title
    rewriter.on('title', {
      text(text) {
        title += text.text;
      }
    });

    // Remove unwanted elements
    if (options.removeScripts !== false) {
      rewriter.on('script', { element: (el) => { el.remove(); } });
      rewriter.on('style', { element: (el) => { el.remove(); } });
      rewriter.on('noscript', { element: (el) => { el.remove(); } });
    }

    // Extract text content from body
    rewriter.on('body', {
      text(text) {
        textContent += text.text;
      }
    });

    // If no body, extract from any text
    rewriter.on('*', {
      text(text) {
        if (!textContent) {
          textContent += text.text;
        }
      }
    });

    const response = new Response(html);
    await rewriter.transform(response).text();

    return textContent.trim() || html;
  }

  /**
   * Convert HTML to markdown using basic text processing (no external dependencies)
   */
  htmlToMarkdown(html: string, options: HTMLProcessorOptions = {}): string {
    try {
      // Pre-process HTML to clean it up
      let cleanHtml = html;
      
      if (options.removeScripts !== false) {
        cleanHtml = cleanHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        cleanHtml = cleanHtml.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
        cleanHtml = cleanHtml.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');
      }

      // Basic HTML to Markdown conversion
      let markdown = cleanHtml;
      
      // Headers
      markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
      markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
      markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
      markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
      markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
      markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');
      
      // Bold and italic
      markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
      markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
      markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
      markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
      
      // Links
      markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
      
      // Code
      markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
      markdown = markdown.replace(/<pre[^>]*>(.*?)<\/pre>/gi, '\n```\n$1\n```\n');
      
      // Lists
      markdown = markdown.replace(/<ul[^>]*>/gi, '\n');
      markdown = markdown.replace(/<\/ul>/gi, '\n');
      markdown = markdown.replace(/<ol[^>]*>/gi, '\n');
      markdown = markdown.replace(/<\/ol>/gi, '\n');
      markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
      
      // Paragraphs and line breaks
      markdown = markdown.replace(/<p[^>]*>/gi, '\n');
      markdown = markdown.replace(/<\/p>/gi, '\n\n');
      markdown = markdown.replace(/<br[^>]*>/gi, '\n');
      
      // Images
      markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)');
      markdown = markdown.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*>/gi, '![$1]($2)');
      markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)');
      
      // Remove remaining HTML tags
      markdown = markdown.replace(/<[^>]*>/g, '');
      
      // Decode HTML entities
      markdown = markdown.replace(/&nbsp;/g, ' ');
      markdown = markdown.replace(/&lt;/g, '<');
      markdown = markdown.replace(/&gt;/g, '>');
      markdown = markdown.replace(/&amp;/g, '&');
      markdown = markdown.replace(/&quot;/g, '"');
      markdown = markdown.replace(/&#39;/g, "'");
      
      // Clean up extra whitespace
      markdown = markdown.replace(/\n\s*\n\s*\n/g, '\n\n');
      markdown = markdown.replace(/^\s+|\s+$/g, '');
      
      return markdown;
    } catch (error) {
      console.error('Error converting HTML to markdown:', error);
      return this.htmlToPlainText(html);
    }
  }

  /**
   * Convert HTML to plain text
   */
  htmlToPlainText(html: string): string {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }

  /**
   * Extract title from HTML
   */
  extractTitle(html: string): string {
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      return titleMatch[1].trim();
    }

    const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
    if (h1Match && h1Match[1]) {
      return h1Match[1].replace(/<[^>]*>/g, '').trim();
    }

    return '';
  }
}