/**
 * Utility functions for converting between Strands and GenU formats
 */

import {
  Metadata,
  StrandsMessage,
  StrandsRole,
  StrandsStreamEvent,
  UnrecordedMessage,
} from 'generative-ai-use-cases';

/**
 * Convert GenU messages to Strands format
 */
export const convertToStrandsFormat = (
  messages: UnrecordedMessage[]
): StrandsMessage[] => {
  return messages.map((message) => ({
    role: message.role as StrandsRole,
    content: [{ text: message.content }],
  }));
};

/**
 * Content block types for state tracking
 */
type ContentBlockType = 'text' | 'toolUse' | 'reasoning' | null;

/**
 * Stateful stream processor for Strands events
 */
export class StrandsStreamProcessor {
  private currentContentBlockType: ContentBlockType = null;
  private toolUseBuffer: string = '';

  /**
   * Process a streaming event and return formatted content
   */
  processEvent(
    eventText: string
  ): { text: string; trace?: string; metadata?: Metadata } | null {
    try {
      const parsedEvent = JSON.parse(eventText);
      const streamEvent = parsedEvent.event as StrandsStreamEvent;

      if (!streamEvent) return null;

      console.log(`Processing streaming event:`, streamEvent);

      // Handle message start event
      if (streamEvent.messageStart) {
        this.reset();
        return null;
      }

      // Handle content block start event
      if (streamEvent.contentBlockStart) {
        const start = streamEvent.contentBlockStart.start;

        if ('text' in start && start.text) {
          this.currentContentBlockType = 'text';
          return { text: start.text };
        } else if ('toolUse' in start && start.toolUse) {
          this.currentContentBlockType = 'toolUse';
          this.toolUseBuffer = '';
          return { text: '', trace: `\`\`\`${start.toolUse.name}\n` };
        }
      }

      // Handle content block delta event (incremental updates)
      if (streamEvent.contentBlockDelta) {
        const delta = streamEvent.contentBlockDelta.delta;

        if (delta.text) {
          this.currentContentBlockType = 'text';
          return { text: delta.text };
        } else if (delta.toolUse) {
          this.currentContentBlockType = 'toolUse';
          this.toolUseBuffer += delta.toolUse.input;
          return { text: '', trace: delta.toolUse.input };
        } else if (delta.reasoningContent?.text) {
          this.currentContentBlockType = 'reasoning';
          return { text: '', trace: delta.reasoningContent.text };
        }
      }

      // Handle content block stop event
      if (streamEvent.contentBlockStop) {
        console.log('contentBlockStop', this.currentContentBlockType);
        if (this.currentContentBlockType === 'text') {
          // Close the text block
          const result = { text: '\n' };
          this.currentContentBlockType = null;
          return result;
        } else if (this.currentContentBlockType === 'toolUse') {
          // Close the tool use block
          const result = { text: '', trace: `\n\`\`\`\n` };
          this.currentContentBlockType = null;
          return result;
        }
        this.currentContentBlockType = null;
        return null;
      }

      // Handle message stop event
      if (streamEvent.messageStop) {
        this.reset();
        return null;
      }

      // Handle metadata event
      if (streamEvent.metadata) {
        console.log(streamEvent.metadata);
        return {
          text: '',
          metadata: {
            usage: {
              inputTokens: streamEvent.metadata.usage.inputTokens,
              outputTokens: streamEvent.metadata.usage.outputTokens,
              totalTokens: streamEvent.metadata.usage.totalTokens,
              cacheReadInputTokens:
                streamEvent.metadata.usage.cacheReadInputTokens,
              cacheWriteInputTokens:
                streamEvent.metadata.usage.cacheWriteInputTokens,
            },
          },
        };
      }

      // Handle error events
      const errorEvent =
        streamEvent.internalServerException ||
        streamEvent.modelStreamErrorException ||
        streamEvent.serviceUnavailableException ||
        streamEvent.throttlingException ||
        streamEvent.validationException;

      if (errorEvent) {
        return {
          text: `Error: ${errorEvent.message || 'An error occurred'}`,
        };
      }

      // Handle redact content event
      if (streamEvent.redactContent) {
        if (streamEvent.redactContent.redactAssistantContentMessage) {
          return {
            text: streamEvent.redactContent.redactAssistantContentMessage,
          };
        }
        return null;
      }

      return null;
    } catch (error) {
      console.error('Error processing stream event:', error);
      return null;
    }
  }

  /**
   * Reset the processor state
   */
  reset(): void {
    this.currentContentBlockType = null;
    this.toolUseBuffer = '';
  }
}
