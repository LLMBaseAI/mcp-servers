import TurndownService from 'turndown';
import type { HTMLProcessorOptions } from '../types';

export class HTMLProcessor {
  private turndownService: TurndownService;

  constructor(_options: HTMLProcessorOptions = {}) {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });

    // Configure turndown rules
    this.setupTurndownRules();
  }

  private setupTurndownRules() {
    // Remove script and style tags completely
    this.turndownService.remove(['script', 'style', 'noscript']);

    // Handle navigation elements
    this.turndownService.addRule('navigation', {
      filter: ['nav', 'aside'],
      replacement: () => '',
    });

    // Handle footer elements
    this.turndownService.addRule('footer', {
      filter: 'footer',
      replacement: (content: string) => (content ? `\n\n---\n${content}\n---\n\n` : ''),
    });

    // Handle code blocks better
    this.turndownService.addRule('preCode', {
      filter: (node: { nodeName: string; firstChild?: { nodeName: string } }) => {
        return node.nodeName === 'PRE' && node.firstChild?.nodeName === 'CODE';
      },
      replacement: (
        content: string,
        node: { firstChild?: { className?: string; textContent?: string } }
      ) => {
        const codeElement = node.firstChild;
        const language = (codeElement?.className || '').match(/language-(\w+)/)?.[1] || '';
        return `\n\n\`\`\`${language}\n${codeElement?.textContent || ''}\n\`\`\`\n\n`;
      },
    });
  }

  /**
   * Convert HTML to clean text using HTMLRewriter (Cloudflare native)
   */
  async htmlToTextWithRewriter(html: string, options: HTMLProcessorOptions = {}): Promise<string> {
    const rewriter = new HTMLRewriter();
    let textContent = '';

    // Extract title (if needed for future use)
    rewriter.on('title', {
      text(_text) {
        // Title extraction logic could be added here if needed
      },
    });

    // Remove unwanted elements
    if (options.removeScripts !== false) {
      rewriter.on('script', {
        element: (el) => {
          el.remove();
        },
      });
      rewriter.on('style', {
        element: (el) => {
          el.remove();
        },
      });
      rewriter.on('noscript', {
        element: (el) => {
          el.remove();
        },
      });
    }

    // Extract text content from body
    rewriter.on('body', {
      text(text) {
        textContent += text.text;
      },
    });

    // If no body, extract from any text
    rewriter.on('*', {
      text(text) {
        if (!textContent) {
          textContent += text.text;
        }
      },
    });

    const response = new Response(html);
    await rewriter.transform(response).text();

    return textContent.trim() || html;
  }

  /**
   * Convert HTML to markdown using Turndown
   */
  htmlToMarkdown(html: string, options: HTMLProcessorOptions = {}): string {
    try {
      // Pre-process HTML to clean it up
      let cleanHtml = html;

      if (options.removeScripts !== false) {
        cleanHtml = cleanHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        cleanHtml = cleanHtml.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
        cleanHtml = cleanHtml.replace(
          /<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi,
          ''
        );
      }

      // Convert to markdown
      let markdown = this.turndownService.turndown(cleanHtml);

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
