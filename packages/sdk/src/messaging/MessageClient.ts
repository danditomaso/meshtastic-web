import type { MeshDevice } from "@meshtastic/core";
import type { EventBus } from "../events/EventBus.ts";
import type { MessageStore } from "./MessageStore.ts";
import type { MessageStoreManager } from "./MessageStoreManager.ts";
import { MessagePipeline } from "./pipeline/MessagePipeline.ts";
import type {
  MessageState,
  MessageType,
  SendTextParams,
} from "./types.ts";

export interface MessagingClientConfig {
  device: MeshDevice;
  deviceId: number;
  myNodeNum: number;
  storeManager: MessageStoreManager;
  eventBus?: EventBus;
  pipeline?: MessagePipeline;
}

export class MessagingClient {
  private device: MeshDevice;
  private deviceId: number;
  private myNodeNum: number;
  private storeManager: MessageStoreManager;
  private store: MessageStore;
  private pipeline: MessagePipeline;
  private eventBus?: EventBus;

  constructor(config: MessagingClientConfig) {
    this.device = config.device;
    this.deviceId = config.deviceId;
    this.myNodeNum = config.myNodeNum;
    this.storeManager = config.storeManager;
    this.eventBus = config.eventBus;
    this.pipeline = config.pipeline ?? new MessagePipeline();

    // Get or create store for this device
    let store = this.storeManager.getStore(this.deviceId) as MessageStore;
    if (!store) {
      store = this.storeManager.addStore(this.deviceId) as MessageStore;
    }

    store.setNodeNum(this.myNodeNum);
    this.store = store;
  }

  async sendText(params: SendTextParams): Promise<number | undefined> {
    const { text, to, channel = 0, wantAck = true, replyId, emoji } = params;

    // Guard: Device must be available
    if (!this.device) {
      console.warn("[MessagingClient] Cannot send message: device not connected");

      // Emit error event
      this.eventBus?.onError.dispatch({
        error: new Error("Device not connected"),
        context: "MessagingClient.sendText",
        deviceId: this.deviceId,
      });

      return undefined;
    }

    try {
      const messageId = await this.device.sendText(
        text,
        to === "broadcast" ? "broadcast" : to,
        wantAck,
        channel,
        replyId,
        emoji,
      );

      if (messageId !== undefined) {
        // Save to store with Ack state
        const message = {
          messageId,
          type: (to === "broadcast" ? "broadcast" : "direct") as MessageType,
          from: this.myNodeNum,
          to: to === "broadcast" ? this.myNodeNum : to,
          channel,
          content: text,
          date: Date.now(),
          state: "ack" as MessageState,
        };

        this.store.saveMessage(message);

        // Emit message sent event
        this.eventBus?.onMessageSent.dispatch({
          message,
          deviceId: this.deviceId,
        });
      }

      return messageId;
    } catch (error) {
      console.error("Failed to send message:", error);

      // Save to store with Failed state
      const failedId = Math.floor(Math.random() * 0xffffffff);
      const failedMessage = {
        messageId: failedId,
        type: (to === "broadcast" ? "broadcast" : "direct") as MessageType,
        from: this.myNodeNum,
        to: to === "broadcast" ? this.myNodeNum : to,
        channel,
        content: text,
        date: Date.now(),
        state: "failed" as MessageState,
      };

      this.store.saveMessage(failedMessage);

      // Emit message failed event
      this.eventBus?.onMessageFailed.dispatch({
        message: failedMessage,
        deviceId: this.deviceId,
      });

      throw error;
    }
  }

  getMessages(
    params:
      | {
          type: "direct";
          nodeA: number;
          nodeB: number;
        }
      | {
          type: "broadcast";
          channelId: number;
        },
  ) {
    return this.store.getMessages(params);
  }

  getDraft(key: number | "broadcast"): string {
    return this.store.getDraft(key);
  }

  setDraft(key: number | "broadcast", text: string): void {
    this.store.setDraft(key, text);

    // Emit draft saved event
    this.eventBus?.onDraftSaved.dispatch({
      key,
      content: text,
      deviceId: this.deviceId,
    });
  }

  clearDraft(key: number | "broadcast"): void {
    this.store.clearDraft(key);

    // Emit draft cleared event
    this.eventBus?.onDraftCleared.dispatch({
      key,
      deviceId: this.deviceId,
    });
  }

  subscribe(listener: (messages: any[]) => void): () => void {
    return this.store.subscribe(listener);
  }
}
