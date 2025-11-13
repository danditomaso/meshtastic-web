import { SimpleEventDispatcher } from "ste-simple-events";
import type { Message, MessageState } from "../messaging/types.ts";

/**
 * Event data for message-related events
 */
export interface MessageEvent {
  message: Message;
  deviceId: number;
}

export interface MessageStateChangeEvent {
  messageId: number;
  conversationId: string;
  previousState: MessageState;
  newState: MessageState;
  deviceId: number;
}

export interface DraftChangeEvent {
  key: number | "broadcast";
  content: string;
  deviceId: number;
}

/**
 * Event data for node-related events (for future use)
 */
export interface NodeEvent {
  nodeNum: number;
  deviceId: number;
}

/**
 * Event data for channel-related events (for future use)
 */
export interface ChannelEvent {
  channelId: number;
  deviceId: number;
}

/**
 * Event data for connection-related events
 */
export interface ConnectionEvent {
  deviceId: number;
  connected: boolean;
  timestamp: Date;
}

/**
 * EventBus provides a centralized event system for the Meshtastic SDK.
 * It uses ste-simple-events for type-safe event dispatching.
 *
 * @example
 * ```typescript
 * const eventBus = new EventBus();
 *
 * // Subscribe to message events
 * eventBus.onMessageReceived.subscribe((event) => {
 *   console.log('New message:', event.message.content);
 * });
 *
 * // Emit an event
 * eventBus.onMessageReceived.dispatch({
 *   message: myMessage,
 *   deviceId: 123,
 * });
 * ```
 */
export class EventBus {
  // ==========================================
  // Message Events
  // ==========================================

  /**
   * Fires when a new message is received from the mesh
   *
   * @event onMessageReceived
   */
  public readonly onMessageReceived = new SimpleEventDispatcher<MessageEvent>();

  /**
   * Fires when a message is sent to the mesh
   *
   * @event onMessageSent
   */
  public readonly onMessageSent = new SimpleEventDispatcher<MessageEvent>();

  /**
   * Fires when a message fails to send
   *
   * @event onMessageFailed
   */
  public readonly onMessageFailed = new SimpleEventDispatcher<MessageEvent>();

  /**
   * Fires when a message state changes (e.g., waiting -> ack)
   *
   * @event onMessageStateChanged
   */
  public readonly onMessageStateChanged =
    new SimpleEventDispatcher<MessageStateChangeEvent>();

  /**
   * Fires when a message is deleted
   *
   * @event onMessageDeleted
   */
  public readonly onMessageDeleted = new SimpleEventDispatcher<{
    messageId: number;
    conversationId: string;
    deviceId: number;
  }>();

  /**
   * Fires when all messages are cleared
   *
   * @event onMessagesCleared
   */
  public readonly onMessagesCleared = new SimpleEventDispatcher<{
    deviceId: number;
  }>();

  /**
   * Fires when a draft message is saved
   *
   * @event onDraftSaved
   */
  public readonly onDraftSaved = new SimpleEventDispatcher<DraftChangeEvent>();

  /**
   * Fires when a draft message is cleared
   *
   * @event onDraftCleared
   */
  public readonly onDraftCleared = new SimpleEventDispatcher<{
    key: number | "broadcast";
    deviceId: number;
  }>();

  // ==========================================
  // Node Events (for future use)
  // ==========================================

  /**
   * Fires when a node is discovered or updated
   *
   * @event onNodeUpdated
   */
  public readonly onNodeUpdated = new SimpleEventDispatcher<NodeEvent>();

  /**
   * Fires when a node is removed
   *
   * @event onNodeRemoved
   */
  public readonly onNodeRemoved = new SimpleEventDispatcher<NodeEvent>();

  // ==========================================
  // Channel Events (for future use)
  // ==========================================

  /**
   * Fires when a channel is created or updated
   *
   * @event onChannelUpdated
   */
  public readonly onChannelUpdated = new SimpleEventDispatcher<ChannelEvent>();

  /**
   * Fires when a channel is removed
   *
   * @event onChannelRemoved
   */
  public readonly onChannelRemoved = new SimpleEventDispatcher<ChannelEvent>();

  // ==========================================
  // Connection Events
  // ==========================================

  /**
   * Fires when the device connection state changes
   *
   * @event onConnectionStateChanged
   */
  public readonly onConnectionStateChanged =
    new SimpleEventDispatcher<ConnectionEvent>();

  /**
   * Fires when there's an error in the SDK
   *
   * @event onError
   */
  public readonly onError = new SimpleEventDispatcher<{
    error: Error;
    context: string;
    deviceId?: number;
  }>();

  // ==========================================
  // Utility Methods
  // ==========================================

  /**
   * Unsubscribe all listeners from all events.
   * Useful for cleanup when disposing the SDK.
   */
  public dispose(): void {
    this.onMessageReceived.clear();
    this.onMessageSent.clear();
    this.onMessageFailed.clear();
    this.onMessageStateChanged.clear();
    this.onMessageDeleted.clear();
    this.onMessagesCleared.clear();
    this.onDraftSaved.clear();
    this.onDraftCleared.clear();
    this.onNodeUpdated.clear();
    this.onNodeRemoved.clear();
    this.onChannelUpdated.clear();
    this.onChannelRemoved.clear();
    this.onConnectionStateChanged.clear();
    this.onError.clear();
  }

  /**
   * Get a count of all active subscriptions across all events.
   * Useful for debugging memory leaks.
   */
  public getSubscriptionCount(): number {
    return (
      this.onMessageReceived.count +
      this.onMessageSent.count +
      this.onMessageFailed.count +
      this.onMessageStateChanged.count +
      this.onMessageDeleted.count +
      this.onMessagesCleared.count +
      this.onDraftSaved.count +
      this.onDraftCleared.count +
      this.onNodeUpdated.count +
      this.onNodeRemoved.count +
      this.onChannelUpdated.count +
      this.onChannelRemoved.count +
      this.onConnectionStateChanged.count +
      this.onError.count
    );
  }
}
