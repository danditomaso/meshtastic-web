import { SimpleEventDispatcher } from "ste-simple-events";
import type {
  ClearMessageParams,
  ConversationId,
  GetMessagesParams,
  IMessageStore,
  Message,
  MessageBuckets,
  MessageId,
  MessageLogMap,
  NodeNum,
  SetMessageStateParams,
} from "./types.ts";
import { evictOldestEntries } from "./utils/eviction.ts";

const MESSAGELOG_RETENTION_NUM = 1000; // Max messages per conversation/channel

export function getConversationId(
  node1: NodeNum,
  node2: NodeNum,
): ConversationId {
  return [node1, node2].sort((a, b) => a - b).join(":");
}

interface MessageStoreData {
  id: number;
  myNodeNum: number | undefined;
  messages: MessageBuckets;
  drafts: Map<number | "broadcast", string>;
}

export class MessageStore implements IMessageStore {
  public readonly id: number;
  public myNodeNum: number | undefined;
  public messages: MessageBuckets;
  public drafts: Map<number | "broadcast", string>;

  private retentionLimit: number;
  private onChange = new SimpleEventDispatcher<void>();

  constructor(
    id: number,
    myNodeNum?: number,
    retentionLimit = MESSAGELOG_RETENTION_NUM,
  ) {
    this.id = id;
    this.myNodeNum = myNodeNum;
    this.retentionLimit = retentionLimit;
    this.messages = {
      direct: new Map<ConversationId, MessageLogMap>(),
      broadcast: new Map<number, MessageLogMap>(),
    };
    this.drafts = new Map<number | "broadcast", string>();
  }

  setNodeNum(nodeNum: number): void {
    this.myNodeNum = nodeNum;
    this.notifyChange();
  }

  saveMessage(message: Message): void {
    let log: MessageLogMap | undefined;

    if (message.type === "direct") {
      const conversationId = getConversationId(message.from, message.to);
      if (!this.messages.direct.has(conversationId)) {
        this.messages.direct.set(conversationId, new Map<MessageId, Message>());
      }

      log = this.messages.direct.get(conversationId);
      log?.set(message.messageId, message);
    } else if (message.type === "broadcast") {
      const channelId = message.channel;
      if (!this.messages.broadcast.has(channelId)) {
        this.messages.broadcast.set(channelId, new Map<MessageId, Message>());
      }

      log = this.messages.broadcast.get(channelId);
      log?.set(message.messageId, message);
    }

    if (log) {
      // Enforce retention limit
      evictOldestEntries(log, this.retentionLimit);
    }

    this.notifyChange();
  }

  setMessageState(params: SetMessageStateParams): void {
    let messageLog: MessageLogMap | undefined;
    let targetMessage: Message | undefined;

    if (params.type === "direct") {
      const conversationId = getConversationId(params.nodeA, params.nodeB);
      messageLog = this.messages.direct.get(conversationId);
      if (messageLog) {
        targetMessage = messageLog.get(params.messageId);
      }
    } else {
      // Broadcast
      messageLog = this.messages.broadcast.get(params.channelId);
      if (messageLog) {
        targetMessage = messageLog.get(params.messageId);
      }
    }

    if (targetMessage) {
      targetMessage.state = params.newState ?? "ack";
    } else {
      console.warn(
        `Message or conversation/channel not found for state update. Params: ${JSON.stringify(
          params,
        )}`,
      );
    }

    this.notifyChange();
  }

  getMessages(params: GetMessagesParams): Message[] {
    let messageMap: MessageLogMap | undefined;

    if (params.type === "direct") {
      const conversationId = getConversationId(params.nodeA, params.nodeB);
      messageMap = this.messages.direct.get(conversationId);
    } else {
      messageMap = this.messages.broadcast.get(params.channelId);
    }

    if (messageMap === undefined) {
      return [];
    }

    const messagesArray = Array.from(messageMap.values());
    messagesArray.sort((a, b) => a.date - b.date);
    return messagesArray;
  }

  getDraft(key: number | "broadcast"): string {
    return this.drafts.get(key) ?? "";
  }

  setDraft(key: number | "broadcast", message: string): void {
    this.drafts.set(key, message);
    this.notifyChange();
  }

  clearDraft(key: number | "broadcast"): void {
    this.drafts.delete(key);
    this.notifyChange();
  }

  deleteAllMessages(): void {
    this.messages.direct = new Map<ConversationId, MessageLogMap>();
    this.messages.broadcast = new Map<number, MessageLogMap>();
    this.notifyChange();
  }

  clearMessageByMessageId(params: ClearMessageParams): void {
    let messageLog: MessageLogMap | undefined;
    let parentMap: Map<ConversationId | number, MessageLogMap>;
    let parentKey: ConversationId | number;

    if (params.type === "direct") {
      parentKey = getConversationId(params.nodeA, params.nodeB);
      parentMap = this.messages.direct;
      messageLog = parentMap.get(parentKey);
    } else {
      // Broadcast
      parentKey = params.channelId;
      parentMap = this.messages.broadcast;
      messageLog = parentMap.get(parentKey);
    }

    if (messageLog) {
      const deleted = messageLog.delete(params.messageId);

      if (deleted) {
        console.log(
          `Deleted message ${params.messageId} from ${params.type} message ${parentKey}`,
        );
        // Clean up empty MessageLogMap and its entry in the parent map
        if (messageLog.size === 0) {
          parentMap.delete(parentKey);
          console.log(`Cleaned up empty message entry for ${parentKey}`);
        }
      } else {
        console.warn(
          `Message ${params.messageId} not found in ${params.type} chat ${parentKey} for deletion.`,
        );
      }
    } else {
      console.warn(
        `Message entry ${parentKey} not found for message deletion.`,
      );
    }

    this.notifyChange();
  }

  // Subscription management
  subscribe(listener: () => void): () => void {
    return this.onChange.subscribe(listener);
  }

  private notifyChange(): void {
    this.onChange.dispatch();
  }

  // Serialization for persistence
  toJSON(): MessageStoreData {
    return {
      id: this.id,
      myNodeNum: this.myNodeNum,
      messages: {
        direct: this.messages.direct,
        broadcast: this.messages.broadcast,
      },
      drafts: this.drafts,
    };
  }

  static fromJSON(
    data: MessageStoreData,
    retentionLimit = MESSAGELOG_RETENTION_NUM,
  ): MessageStore {
    const store = new MessageStore(data.id, data.myNodeNum, retentionLimit);

    // Restore messages
    store.messages = {
      direct: new Map(
        Array.from(data.messages.direct?.entries() ?? []).map(
          ([conversationId, messageMap]) => [
            conversationId,
            new Map(
              Object.entries(messageMap).map(([id, msg]) => [Number(id), msg]),
            ),
          ],
        ),
      ),
      broadcast: new Map(
        Array.from(data.messages.broadcast?.entries() ?? []).map(
          ([channelId, messageMap]) => [
            channelId,
            new Map(
              Object.entries(messageMap).map(([id, msg]) => [Number(id), msg]),
            ),
          ],
        ),
      ),
    };

    // Restore drafts
    store.drafts = new Map(data.drafts?.entries() ?? []);

    return store;
  }
}
