import { Protobuf, Types } from "@meshtastic/core";

// export type MessageState = "ack" | "waiting" | Protobuf.Mesh.Routing_Error;
const MESSAGE_STATES = {
  ack: "ack",
  waiting: "waiting",
  failed: Protobuf.Mesh.Routing_Error.NONE,
}
export type MessageState = keyof typeof MESSAGE_STATES;

export type MessageType = "broadcast" | "direct";

interface MessageBase {
  channel: Types.ChannelNumber;
  to: number;
  from: number;
  date: Date;
  messageId: number;
  state: MessageState;
  message: string;
}

interface GenericMessage<T extends MessageType> extends MessageBase {
  type: T;
}

export type DirectMessage = GenericMessage<"direct">;
export type BroadcastMessage = GenericMessage<"broadcast">;

export type Message = DirectMessage | BroadcastMessage

// export interface Message{
//   id: number;
//   date: Date;
//   type: MessageType;
//   from: number
//   to: number;
//   channel: number;
//   data: string;
//   state: MessageState;
// }

export interface MessageQueueItem {
  id: number;
  data: Message;
}
