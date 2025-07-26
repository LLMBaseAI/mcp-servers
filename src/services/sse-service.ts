
export interface SSEMessage {
  id?: string;
  event?: string;
  data: string;
  retry?: number;
}

export class SSEService {
  private static formatMessage(message: SSEMessage): string {
    let formatted = '';
    
    if (message.id) {
      formatted += `id: ${message.id}\n`;
    }
    
    if (message.event) {
      formatted += `event: ${message.event}\n`;
    }
    
    if (message.retry) {
      formatted += `retry: ${message.retry}\n`;
    }
    
    // Handle multi-line data
    const lines = message.data.split('\n');
    for (const line of lines) {
      formatted += `data: ${line}\n`;
    }
    
    formatted += '\n';
    return formatted;
  }

  static createSSEResponse(sessionId?: string): Response {
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const welcome: SSEMessage = {
          id: '1',
          event: 'connected',
          data: JSON.stringify({
            type: 'connection',
            sessionId: sessionId || generateSessionId(),
            timestamp: new Date().toISOString(),
            message: 'MCP SSE stream established'
          })
        };
        
        controller.enqueue(new TextEncoder().encode(SSEService.formatMessage(welcome)));
      },
      
      cancel() {
        // Cleanup when client disconnects
        console.log('SSE stream cancelled');
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  }

  static sendSSEMessage(controller: ReadableStreamDefaultController, message: SSEMessage): void {
    const formatted = this.formatMessage(message);
    controller.enqueue(new TextEncoder().encode(formatted));
  }

  static createProgressStream(
    operation: () => AsyncGenerator<unknown, void, unknown>
  ): Response {
    let messageId = 1;
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send start message
          SSEService.sendSSEMessage(controller, {
            id: (messageId++).toString(),
            event: 'start',
            data: JSON.stringify({
              type: 'operation_start',
              timestamp: new Date().toISOString()
            })
          });

          // Stream progress updates
          for await (const progress of operation()) {
            SSEService.sendSSEMessage(controller, {
              id: (messageId++).toString(),
              event: 'progress',
              data: JSON.stringify(progress)
            });
          }

          // Send completion message
          SSEService.sendSSEMessage(controller, {
            id: (messageId++).toString(),
            event: 'complete',
            data: JSON.stringify({
              type: 'operation_complete',
              timestamp: new Date().toISOString()
            })
          });

        } catch (error) {
          // Send error message
          SSEService.sendSSEMessage(controller, {
            id: (messageId++).toString(),
            event: 'error',
            data: JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            })
          });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  }
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export interface MCPSSEMessage {
  jsonrpc: '2.0';
  id?: string | number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export class MCPSSEHandler {
  private sessionId: string;
  private messageId = 1;

  constructor(sessionId?: string) {
    this.sessionId = sessionId || generateSessionId();
  }

  createMCPSSEResponse(): Response {
    const stream = new ReadableStream({
      start: (controller) => {
        // Send initialization message
        this.sendMCPMessage(controller, {
          jsonrpc: '2.0',
          method: 'notifications/initialized',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {}
            },
            serverInfo: {
              name: '@llmbase/mcp-servers',
              version: '1.0.0'
            },
            sessionId: this.sessionId
          }
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  }

  private sendMCPMessage(controller: ReadableStreamDefaultController, message: MCPSSEMessage): void {
    const sseMessage: SSEMessage = {
      id: (this.messageId++).toString(),
      event: message.method ? 'notification' : 'response',
      data: JSON.stringify(message)
    };

    SSEService.sendSSEMessage(controller, sseMessage);
  }

  sendToolResponse(controller: ReadableStreamDefaultController, id: string | number, result: unknown): void {
    this.sendMCPMessage(controller, {
      jsonrpc: '2.0',
      id,
      result
    });
  }

  sendError(controller: ReadableStreamDefaultController, id: string | number, error: Error | { message: string }): void {
    this.sendMCPMessage(controller, {
      jsonrpc: '2.0',
      id,
      error: {
        code: -1,
        message: error.message || 'Unknown error',
        data: error
      }
    });
  }
}