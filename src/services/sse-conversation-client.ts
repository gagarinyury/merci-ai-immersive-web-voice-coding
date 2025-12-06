/**
 * SSE Conversation Client
 *
 * Handles Server-Sent Events for real-time conversation updates
 */

export interface SSEConversationOptions {
  onToolStart?: (toolName: string) => void;
  onToolComplete?: (toolName: string) => void;
  onToolFailed?: (toolName: string, error?: string) => void;
  onThinking?: (text: string) => void;
  onTextChunk?: (text: string) => void;
  onDone?: (response: string, sessionId: string) => void;
  onError?: (error: string) => void;
}

export class SSEConversationClient {
  /**
   * Send message and listen for SSE events
   */
  async sendMessage(
    message: string,
    sessionId: string | undefined,
    options: SSEConversationOptions
  ): Promise<void> {
    const url = '/api/conversation';

    try {
      // Make POST request with fetch
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, sessionId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('✅ SSE stream closed');
          break;
        }

        // Decode chunk
        buffer += decoder.decode(value, { stream: true });

        // Process complete events (delimited by \n\n)
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Keep incomplete event in buffer

        for (const eventStr of events) {
          if (!eventStr.trim()) continue;

          // Parse SSE event
          const lines = eventStr.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.substring(6));
              this.handleEvent(data, options);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ SSE conversation error:', error);
      if (options.onError) {
        options.onError(error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  private handleEvent(event: any, options: SSEConversationOptions) {
    console.log('📥 SSE event:', event.type);

    switch (event.type) {
      case 'tool_start':
        if (options.onToolStart) {
          options.onToolStart(event.toolName);
        }
        break;

      case 'tool_complete':
        if (options.onToolComplete) {
          options.onToolComplete(event.toolName);
        }
        break;

      case 'tool_failed':
        if (options.onToolFailed) {
          options.onToolFailed(event.toolName, event.error);
        }
        break;

      case 'agent_thinking':
        if (options.onThinking) {
          options.onThinking(event.text);
        }
        break;

      case 'text_chunk':
        if (options.onTextChunk) {
          options.onTextChunk(event.text);
        }
        break;

      case 'done':
        if (options.onDone) {
          options.onDone(event.response, event.sessionId);
        }
        break;

      case 'error':
        if (options.onError) {
          options.onError(event.error);
        }
        break;

      default:
        console.warn('⚠️ Unknown SSE event type:', event.type);
    }
  }
}
