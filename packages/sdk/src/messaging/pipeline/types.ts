import type { Protobuf } from "@meshtastic/core";

export interface MeshMessage {
  id: number;
  content: Uint8Array | string;
  from: number;
  to: number | "broadcast";
  channel: number;
  portNum: Protobuf.Portnums.PortNum;
  timestamp: Date;
  wantAck?: boolean;
  replyId?: number;
  emoji?: number;
  rxSnr?: number;
  rxTime?: Date;
}

export interface MessageContext {
  message: MeshMessage;
  state: Map<string, any>;
  metadata: {
    myNodeNum: number;
    publicKey?: Uint8Array;
    [key: string]: any;
  };
  abort: () => void;
}

export type MessageProcessor = (
  ctx: MessageContext,
) => Promise<MessageContext> | MessageContext;

export interface ProcessorConfig {
  name: string;
  enabled?: boolean;
}

export enum MessageState {
  Pending = "pending",
  Ack = "ack",
  Failed = "failed",
}
