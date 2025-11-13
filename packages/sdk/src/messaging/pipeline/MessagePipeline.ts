import type { MessageContext, MessageProcessor } from "./types.ts";

export class MessagePipeline {
  private processors: Array<{
    name: string;
    processor: MessageProcessor;
    enabled: boolean;
  }> = [];

  private errorHandler?: (error: Error, ctx: MessageContext) => void;
  private onComplete?: (ctx: MessageContext) => void;

  use(name: string, processor: MessageProcessor, enabled = true): this {
    this.processors.push({ name, processor, enabled });
    return this;
  }

  onError(handler: (error: Error, ctx: MessageContext) => void): this {
    this.errorHandler = handler;
    return this;
  }

  onSuccess(handler: (ctx: MessageContext) => void): this {
    this.onComplete = handler;
    return this;
  }

  async process(ctx: MessageContext): Promise<MessageContext> {
    let currentCtx = ctx;

    try {
      for (const { name, processor, enabled } of this.processors) {
        if (!enabled) {
          continue;
        }

        try {
          currentCtx = await processor(currentCtx);
        } catch (error) {
          console.error(`Processor "${name}" failed:`, error);
          throw error;
        }
      }

      this.onComplete?.(currentCtx);
      return currentCtx;
    } catch (error) {
      this.errorHandler?.(error as Error, currentCtx);
      throw error;
    }
  }

  disable(processorName: string): void {
    const processor = this.processors.find((p) => p.name === processorName);
    if (processor) {
      processor.enabled = false;
    }
  }

  enable(processorName: string): void {
    const processor = this.processors.find((p) => p.name === processorName);
    if (processor) {
      processor.enabled = true;
    }
  }
}
