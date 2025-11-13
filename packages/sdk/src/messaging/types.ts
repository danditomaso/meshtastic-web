// Message types and interfaces
export type NodeNum = number;
export type ChannelId = number;
export type MessageId = number;
export type ConversationId = string;
export type MessageLogMap = Map<MessageId, Message>;

export type MessageState = "ack" | "waiting" | "failed";
export type MessageType = "direct" | "broadcast";

export interface Message {
  messageId: MessageId;
  type: MessageType;
  from: NodeNum;
  to: NodeNum;
  channel: ChannelId;
  content: string;
  date: number;
  state: MessageState;
  rxSnr?: number;
  rxTime?: number;
}

export interface MessageBuckets {
  direct: Map<ConversationId, MessageLogMap>;
  broadcast: Map<ChannelId, MessageLogMap>;
}

export type GetMessagesParams =
  | {
      type: "direct";
      nodeA: NodeNum;
      nodeB: NodeNum;
    }
  | {
      type: "broadcast";
      channelId: ChannelId;
    };

export type SetMessageStateParams =
  | {
      type: "direct";
      nodeA: NodeNum;
      nodeB: NodeNum;
      messageId: MessageId;
      newState?: MessageState;
    }
  | {
      type: "broadcast";
      channelId: ChannelId;
      messageId: MessageId;
      newState?: MessageState;
    };

export type ClearMessageParams =
  | {
      type: "direct";
      nodeA: NodeNum;
      nodeB: NodeNum;
      messageId: MessageId;
    }
  | {
      type: "broadcast";
      channelId: ChannelId;
      messageId: MessageId;
    };

export interface SendTextParams {
  text: string;
  to: number | "broadcast";
  channel?: number;
  wantAck?: boolean;
  replyId?: number;
  emoji?: number;
}

export interface MessageStoreConfig {
  id: number;
  retentionLimit?: number;
  enablePersistence?: boolean;
  storageKey?: string;
}

export interface IMessageStore {
  id: number;
  myNodeNum: number | undefined;
  messages: MessageBuckets;
  drafts: Map<number | "broadcast", string>;

  setNodeNum: (nodeNum: number) => void;
  saveMessage: (message: Message) => void;
  setMessageState: (params: SetMessageStateParams) => void;
  getMessages: (params: GetMessagesParams) => Message[];

  getDraft: (key: number | "broadcast") => string;
  setDraft: (key: number | "broadcast", message: string) => void;
  clearDraft: (key: number | "broadcast") => void;

  deleteAllMessages: () => void;
  clearMessageByMessageId: (params: ClearMessageParams) => void;
}
