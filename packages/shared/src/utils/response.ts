import type { MCPResponse } from '../types.js';

/**
 * Create a successful MCP response
 */
export function createSuccessResponse<T>(data: T, timestamp?: string): MCPResponse<T> {
  return {
    success: true,
    data,
    timestamp: timestamp || new Date().toISOString()
  };
}

/**
 * Create an error MCP response
 */
export function createErrorResponse(error: string, code?: string, timestamp?: string): MCPResponse {
  return {
    success: false,
    error,
    code,
    timestamp: timestamp || new Date().toISOString()
  };
}

/**
 * Wrap an async operation with standardized error handling
 */
export async function wrapOperation<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<MCPResponse<T>> {
  try {
    const result = await operation();
    return createSuccessResponse(result);
  } catch (error) {
    const message = errorMessage || (error instanceof Error ? error.message : 'Unknown error');
    return createErrorResponse(message, error instanceof Error ? error.name : 'UNKNOWN_ERROR');
  }
}