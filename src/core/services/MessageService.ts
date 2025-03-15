import { MeshDevice } from "@meshtastic/core";
import type { Types } from "@meshtastic/core";
import { randId } from "@core/utils/randId.ts";
import { Message, MessageQueueItem, MessageType } from "@core/services/types.ts";

const QUEUE_CONSTANTS = {
  MAX_FREE_SLOTS: 15,
  CONGESTION_THRESHOLD: 10,
  CONGESTION_DELAY_MULTIPLIER: 2000,
  MAX_BACKOFF_TIME: 10000,
  NORMAL_DELAY: 500
} as const;

export type MessageStore = {
  direct: Map<number, Message[]>;
  broadcast: Map<Types.ChannelNumber, Message[]>;
};

export interface MessageReceivedEvent extends CustomEvent {
  detail: Message;
}

export class MessageService extends EventTarget {
  private readonly connection: MeshDevice;
  private readonly messageQueue: MessageQueueItem[];
  private queueStatus: { free: number };
  private isProcessing: boolean = false;
  private processor: ((item: MessageQueueItem) => Promise<void>) | null = null;

  private messages: MessageStore = {
    direct: new Map<number, Message[]>(),
    broadcast: new Map<Types.ChannelNumber, Message[]>(),
  };

  public static async create(connection: MeshDevice): Promise<MessageService> {
    await Promise.resolve()
    return new MessageService(connection);
  }

  constructor(connection: MeshDevice) {
    super();
    this.connection = connection;
    this.messageQueue = [];
    this.queueStatus = { free: QUEUE_CONSTANTS.MAX_FREE_SLOTS };
    this.subscribe();
  }

  private subscribe(): void {
    if (!this.connection?.events) {
      // throw new Error("Connection events are not available");
    }

    this.connection.events.onMessagePacket.subscribe((packet) => {
      try {
        console.log("Received raw packet:", packet);
        // const message = MessageDTO.fromMessagePacket(packet);
        this.storeMessage(packet);

        // Dispatch a custom event with the received message
        this.dispatchEvent(
          new CustomEvent<Message>("message:received", { detail: packet })
        );
      } catch (error) {
        console.error("Error processing received packet:", error);
      }

    });

    this.connection.events.onQueueStatus.subscribe((queueStatus) => {
      try {
        this.queueStatus = queueStatus;
        this.processQueue().catch(error => {
          console.error("Error in process queue:", error);
        });
      } catch (error) {
        console.error("Error processing queue status:", error);
      }
    });


  }

  private readonly delay = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));

  /**
   * Set a custom processor for handling queue items
   */
  public setProcessor(processor: (item: MessageQueueItem) => Promise<void>): void {
    this.processor = processor;
  }

  /**
   * Remove an item from the queue by ID
   */
  public removeFromQueue(id: number): void {
    const index = this.messageQueue.findIndex(item => item?.id === id);
    if (index !== -1) {
      this.messageQueue.splice(index, 1);
    }
  }

  private async processQueue(): Promise<void> {
    // Prevent multiple simultaneous queue processing
    if (this.isProcessing || this.messageQueue.length === 0) return;

    this.isProcessing = true;

    try {
      // Use the custom processor if set, otherwise use default processing
      if (this.processor) {
        // Process each item in the queue with the custom processor
        // Note: The processor is responsible for removing the item from the queue
        for (const item of [...this.messageQueue]) {
          await this.processor(item);
        }
      } else {
        // Default processing behavior
        while (this.messageQueue.length > 0) {
          const item = this.messageQueue.shift();
          if (!item) continue;

          try {
            console.debug(`Processing message: ${item.data.message}`);

            // Apply backoff strategy when queue is congested
            if (this.queueStatus.free <= QUEUE_CONSTANTS.CONGESTION_THRESHOLD) {
              console.debug("Queue is congested, implementing backoff...");
              const backoffTime = Math.min(
                QUEUE_CONSTANTS.CONGESTION_DELAY_MULTIPLIER *
                (QUEUE_CONSTANTS.CONGESTION_THRESHOLD + 1 - this.queueStatus.free),
                QUEUE_CONSTANTS.MAX_BACKOFF_TIME
              );
              await this.delay(backoffTime);
            } else if (this.queueStatus.free <= QUEUE_CONSTANTS.MAX_FREE_SLOTS) {
              await this.delay(QUEUE_CONSTANTS.NORMAL_DELAY);
            }

            const messageId = await this.sendMessage(
              item.data.message,
              item.data.to,
              item.data.channel
            );

            if (messageId !== null) {
              const outgoingMessage: Message = {
                messageId,
                date: new Date(),
                type: item.data.type,
                from: this.connection.myNodeInfo.myNodeNum,
                to: item.data.to,
                channel: item.data.channel,
                message: item.data.message,
                state: "ack",
              };

              this.storeMessage(outgoingMessage);
              this.dispatchEvent(
                new CustomEvent<Message>("message:sent", { detail: outgoingMessage })
              );
            }

            console.log(`Message sent successfully: ${item.data.message}`);
          } catch (error) {
            console.error(`Failed to process message: ${item.data.message}`, error);
            // Optionally re-queue the message for retry or notify failure
            this.dispatchEvent(
              new CustomEvent("message:error", {
                detail: { message: item.data, error }
              })
            );
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async sendMessage(
    message: string,
    to: number,
    channel: number
  ): Promise<number | null> {
    try {
      console.log("Sending message:", message, to, channel);

      return await this.connection.sendText(message, to, true, channel);
    } catch (error) {
      console.error("Error sending message:", error);
      throw error; // Let the caller handle the error
    }
  }

  /**
   * Queue a message to be sent
   * @param messageItem - The message to send
   * @returns The ID of the queued message
   */
  public send(messageItem: MessageQueueItem): number {
    // Ensure the message item has an ID
    if (!messageItem.id) {
      messageItem.id = randId()
    }

    this.messageQueue.push(messageItem);
    this.processQueue().catch(error => {
      console.error("Error in process queue:", error);
    });

    return messageItem.id;
  }

  /**
   * Send a text message with less boilerplate
   * @returns The ID of the queued message
   */
  public sendText(
    text: string,
    to: number,
    channel: number = 0,
    type: MessageType = to === 0 ? "broadcast" : "direct"
  ): number {
    return this.send({
      id: randId(),
      data: {
        messageId: randId(),
        message: text, // Support for both message and data fields
        from: 0,
        to,
        date: new Date(),
        state: 'waiting',
        channel,
        type
      }
    });
  }

  /**
   * Direct method to send text without queueing
   */
  public async sendTextDirectly(
    text: string,
    to: number = 0,
    channel: number = 0
  ): Promise<number | null> {
    return this.sendMessage(text, to, channel);
  }

  /**
   * Store a message in the appropriate collection
   */
  private storeMessage(message: Message): void {
    // Use the correct map based on message type
    const targetMap = message.type === "direct"
      ? this.messages.direct
      : this.messages.broadcast;

    // Use the appropriate key based on message type
    const key = message.type === "direct" ? message.to : message.channel;

    if (!targetMap.has(key)) {
      targetMap.set(key, []);
    }

    const messages = targetMap.get(key);
    if (messages) {
      messages.push(message);

      // Sort messages by time to maintain chronological order
      messages.sort((a, b) => a?.date.getTime() - b.date.getTime());
    }
  }

  /**
   * Get all stored messages
   */
  public getMessages(): MessageStore {
    return this.messages;
  }


  /**
   * Get messages for a specific recipient or channel
   */
  public getMessagesFor(
    type: MessageType,
    target: number | Types.ChannelNumber
  ): Message[] {
    const map = type === "direct" ? this.messages.direct : this.messages.broadcast;
    return map.get(target) || [];
  }

  /**
   * Subscribe to received messages
   */
  public onMessage(callback: (message: Message) => void): () => void {
    const eventListener = ((event: Event) => {
      callback((event as MessageReceivedEvent).detail);
    }) as EventListener;

    this.addEventListener("message:received", eventListener);

    // Return a function to unsubscribe
    return () => this.removeEventListener("message:received", eventListener);
  }

  /**
   * Subscribe to sent messages
   */
  public onMessageSent(callback: (message: Message) => void): () => void {
    const eventListener = ((event: Event) => {
      callback((event as MessageReceivedEvent).detail);
    }) as EventListener;

    this.addEventListener("message:sent", eventListener);

    // Return a function to unsubscribe
    return () => this.removeEventListener("message:sent", eventListener);
  }

  /**
   * Clear all stored messages
   */
  public clearMessages(): void {
    this.messages.direct.clear();
    this.messages.broadcast.clear();
  }

  /**
   * Get the number of pending messages in the queue
   */
  public getPendingCount(): number {
    return this.messageQueue.length;
  }
}