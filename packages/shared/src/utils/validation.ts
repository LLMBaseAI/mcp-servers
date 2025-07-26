/**
 * Validate if a URL is safe and allowed for processing
 */
export function validateUrl(url: string): { isValid: boolean; error?: string } {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow HTTP and HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { isValid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
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
      return { isValid: false, error: 'Private IP addresses and localhost are not allowed' };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

/**
 * Sanitize user input strings
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[\x00-\x1f\x7f-\x9f]/g, ''); // Remove control characters
}

/**
 * Validate timeout value
 */
export function validateTimeout(timeout: number): number {
  const min = 1000;  // 1 second
  const max = 60000; // 60 seconds
  return Math.min(Math.max(timeout, min), max);
}

/**
 * Validate concurrency limit
 */
export function validateConcurrency(concurrent: number): number {
  const min = 1;
  const max = 10;
  return Math.min(Math.max(concurrent, min), max);
}