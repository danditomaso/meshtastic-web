# @meshtastic/client-sdk

[![JSR](https://jsr.io/badges/@meshtastic/client-sdk)](https://jsr.io/@meshtastic/client-sdk)
[![CI](https://img.shields.io/github/actions/workflow/status/meshtastic/web/ci.yml?branch=main&label=actions&logo=github&color=yellow)](https://github.com/meshtastic/web/actions/workflows/ci.yml)

> High-level TypeScript SDK for building Meshtastic applications with built-in state management, persistence, and event handling.

## Purpose

### What is Meshtastic?

[Meshtastic](https://meshtastic.org) is an open-source, decentralized mesh networking platform that enables long-range, off-grid communication using low-power LoRa radios. It's perfect for hiking, emergency communication, IoT applications, and anywhere traditional networks are unavailable or unreliable.

### The Challenge

Building applications for Meshtastic devices involves significant complexity:

- **Low-level Protocol Handling** - Direct interaction with Protocol Buffers, device packets, and radio configurations
- **State Management** - Manual tracking of messages, nodes, channels, and device state across sessions
- **Persistence** - Implementing storage for messages and drafts with proper serialization/deserialization
- **Event Coordination** - Managing asynchronous events from mesh network activity
- **Connection Management** - Handling multiple transport types (BLE, HTTP, Serial) consistently
- **Memory Management** - Preventing unbounded growth of message history

These challenges slow down development and lead to inconsistent implementations across applications.

### The Solution

The **Meshtastic Client SDK** solves these problems by providing a batteries-included, high-level abstraction:

- **Unified Client Interface** - Single `MeshtasticClient` that works with any transport layer
- **Automatic State Management** - Built-in stores for messages, nodes, channels, and configuration
- **Built-in Persistence** - IndexedDB-backed storage with automatic debounced saves
- **Reactive Events** - Subscribe to mesh events using a type-safe event bus
- **Framework Agnostic** - Works with React, Vue, Svelte, vanilla JS, Node.js, or Deno
- **Composable Architecture** - Use only the parts you need via tree-shaking

### Ecosystem Context

This package sits at the **application layer** of the Meshtastic JavaScript ecosystem:

```
┌─────────────────────────────────────┐
│   Your Application (React, etc.)   │  ← You are here
├─────────────────────────────────────┤
│  @meshtastic/client-sdk             │  ← High-level SDK (this package)
├─────────────────────────────────────┤
│  @meshtastic/core                   │  ← Protocol Buffers, device API
├─────────────────────────────────────┤
│  Transport Layer (BLE/HTTP/Serial)  │  ← Device connections
└─────────────────────────────────────┘
```

It builds on top of `@meshtastic/core` to provide developer-friendly APIs while handling the complexity of state management and persistence internally.

### Who Should Use This

This SDK is ideal for:

- **Web Developers** building Meshtastic UIs in the browser
- **Framework Users** integrating Meshtastic into React, Vue, or Svelte apps
- **Node.js/Deno Developers** creating CLI tools or backend services for Meshtastic
- **Application Builders** who want to focus on UX instead of protocol details

If you're building a low-level library or need direct protocol control, use `@meshtastic/core` instead.

## Overview

The Meshtastic Client SDK provides a modern, type-safe interface for building Meshtastic applications. It abstracts away the complexity of device communication, message handling, and state management, allowing you to focus on building great user experiences.

## Features

### ✨ Core Features

- **🎯 Type-Safe** - Full TypeScript support with comprehensive type definitions
- **📦 Message Management** - Send, receive, and persist messages with automatic state tracking
- **💾 Built-in Persistence** - Automatic message storage using IndexedDB
- **🔔 Event System** - Reactive event bus using `ste-simple-events`
- **🎨 Composable Pipeline** - Extensible message processing pipeline
- **🌳 Tree-Shakeable** - Import only what you need
- **🚀 Universal** - Works in browser, Node.js, and Deno
- **♻️ Memory Management** - Automatic message retention and cleanup

### 📨 Messaging Client

Send and receive text messages with full state tracking:

```typescript
import { MeshtasticClient } from "@meshtastic/client-sdk";

const client = new MeshtasticClient({
  device,
  deviceId: device.id,
  myNodeNum: 123456,
  enablePersistence: true,
});

// Send a message
await client.messages.sendText({
  text: "Hello mesh!",
  to: "broadcast",
  channel: 0,
  wantAck: true,
});

// Get messages
const messages = client.messages.getMessages({
  type: "broadcast",
  channelId: 0,
});

// Subscribe to messages
client.messages.subscribe(() => {
  console.log("Messages updated!");
});
```

**Messaging Features:**
- ✅ Send direct and broadcast messages
- ✅ Message state tracking (waiting, ack, failed)
- ✅ Draft message management
- ✅ Conversation-based organization
- ✅ Message retention limits
- ✅ Automatic deduplication

### 🔔 Event Bus

React to SDK events in real-time:

```typescript
// Message events
client.events.onMessageReceived.subscribe((event) => {
  console.log("New message:", event.message);
});

client.events.onMessageSent.subscribe((event) => {
  console.log("Message sent:", event.message);
});

client.events.onMessageFailed.subscribe((event) => {
  console.error("Message failed:", event.message);
});

// Draft events
client.events.onDraftSaved.subscribe((event) => {
  console.log("Draft saved for:", event.key);
});

// Error handling
client.events.onError.subscribe((event) => {
  console.error("SDK error:", event.error, event.context);
});
```

**Event Types:**
- `onMessageReceived` - New message from mesh
- `onMessageSent` - Message successfully sent
- `onMessageFailed` - Message send failed
- `onMessageStateChanged` - Message state updated
- `onMessageDeleted` - Message removed
- `onMessagesCleared` - All messages cleared
- `onDraftSaved` - Draft message saved
- `onDraftCleared` - Draft removed
- `onError` - SDK errors

### 🔄 Message Pipeline

Extensible processing pipeline for incoming/outgoing messages:

```typescript
import { MessagePipeline } from "@meshtastic/client-sdk";

const pipeline = new MessagePipeline();

// Add processors
pipeline
  .use("validation", validateMessage())
  .use("encryption", checkEncryption())
  .use("persistence", persistMessage(saveFn))
  .use("logging", logMessage());

// Error handling
pipeline.onError((error, ctx) => {
  console.error("Pipeline error:", error);
});

// Success callback
pipeline.onSuccess((ctx) => {
  console.log("Message processed:", ctx.message);
});

// Process a message
await pipeline.process(messageContext);
```

**Built-in Processors:**
- `validateMessage()` - Content validation and size limits
- `checkEncryption()` - Encryption status tracking
- `persistMessage()` - Save to storage
- `trackUnread()` - Unread message counting
- `transformToProtobuf()` - Format conversion
- `logMessage()` - Debug logging

### 💾 Persistence Layer

Automatic message persistence with IndexedDB:

```typescript
import { MessageStoreManager } from "@meshtastic/client-sdk";

const storeManager = new MessageStoreManager({
  enablePersistence: true,
  messageRetentionLimit: 1000,
  storeRetentionLimit: 10,
  storageKey: "meshtastic-messages",
  saveDebounceMs: 1000,
});

// Add a store for a device
const store = storeManager.addStore(deviceId);

// Messages are automatically persisted
store.saveMessage(message);

// Force save (e.g., before app closes)
await storeManager.forceSave();

// Cleanup
await storeManager.shutdown();
```

**Storage Features:**
- ✅ Automatic debounced saves
- ✅ Message retention limits
- ✅ Multi-device support
- ✅ Conversation-based buckets
- ✅ Draft persistence
- ✅ Graceful degradation (works without IndexedDB)

### 🏗️ Architecture

```
MeshtasticClient
├─ MessagingClient           (High-level messaging API)
│  ├─ MessageStore           (In-memory message storage)
│  ├─ MessagePipeline        (Processing pipeline)
│  └─ EventBus               (Event notifications)
├─ MessageStoreManager       (Multi-device storage)
│  └─ IndexedDBAdapter       (Persistence layer)
└─ EventBus                  (Global event system)
```

## Installation

### NPM

```bash
npm install @meshtastic/client-sdk
```

### JSR

```bash
# Deno
deno add @meshtastic/client-sdk

# Node.js
npx jsr add @meshtastic/client-sdk
```

## Quick Start

### Basic Usage

```typescript
import { MeshtasticClient } from "@meshtastic/client-sdk";
import { BleConnection } from "@meshtastic/transport-ble";

// Create device connection
const device = new BleConnection();
await device.connect();

// Create client
const client = new MeshtasticClient({
  device,
  deviceId: device.id,
  myNodeNum: 123456,
  enablePersistence: true,
});

await client.connect();

// Send a message
await client.messages.sendText({
  text: "Hello!",
  to: "broadcast",
  channel: 0,
});

// Get messages
const messages = client.messages.getMessages({
  type: "broadcast",
  channelId: 0,
});

// Subscribe to updates
client.events.onMessageReceived.subscribe((event) => {
  console.log("New message:", event.message.content);
});

// Cleanup
await client.shutdown();
```

### React Integration

```typescript
import { MeshtasticClient } from "@meshtastic/client-sdk";
import { useEffect, useState } from "react";

function MessagesComponent() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const client = new MeshtasticClient({ ... });
    await client.connect();

    // Subscribe to messages
    const unsubscribe = client.events.onMessageReceived.subscribe((event) => {
      setMessages((prev) => [...prev, event.message]);
    });

    return () => {
      unsubscribe();
      client.shutdown();
    };
  }, []);

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.messageId}>{msg.content}</div>
      ))}
    </div>
  );
}
```

### TanStack Router Integration

```typescript
import { createRouter, createRootRouteWithContext } from "@tanstack/react-router";
import { getMeshtasticContext } from "@meshtastic/client-sdk";

interface RouterContext {
  messages: MessagingClient;
  events: EventBus;
  client: MeshtasticClient;
}

const router = createRouter({
  routeTree,
  context: getMeshtasticContext(),
});

// Use in routes
function MessagesRoute() {
  const { messages, events } = Route.useRouteContext();

  await messages.sendText({ ... });
}
```

## API Reference

### MeshtasticClient

```typescript
interface MeshtasticClientConfig {
  device: MeshDevice;
  deviceId: number;
  myNodeNum: number;
  enablePersistence?: boolean;
  messageRetentionLimit?: number;
  storageKey?: string;
}

class MeshtasticClient {
  readonly messages: MessagingClient;
  readonly events: EventBus;

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  shutdown(): Promise<void>;
}
```

### MessagingClient

```typescript
interface SendTextParams {
  text: string;
  to: number | "broadcast";
  channel?: number;
  wantAck?: boolean;
  replyId?: number;
  emoji?: number;
}

class MessagingClient {
  sendText(params: SendTextParams): Promise<number | undefined>;
  getMessages(params: GetMessagesParams): Message[];
  getDraft(key: number | "broadcast"): string;
  setDraft(key: number | "broadcast", text: string): void;
  clearDraft(key: number | "broadcast"): void;
  subscribe(listener: () => void): () => void;
}
```

### Types

```typescript
interface Message {
  messageId: number;
  type: "direct" | "broadcast";
  from: number;
  to: number;
  channel: number;
  content: string;
  date: number;
  state: "ack" | "waiting" | "failed";
  rxSnr?: number;
  rxTime?: number;
}

interface MessageEvent {
  message: Message;
  deviceId: number;
}
```

## Roadmap

### Current (v2.7.0)
- ✅ Messaging client
- ✅ Message persistence
- ✅ Event system
- ✅ Message pipeline

### Coming Soon
- 🚧 Node management client
- 🚧 Channel management client
- 🚧 Configuration client
- 🚧 Telemetry client
- 🚧 Waypoint management
- 🚧 Message reactions
- 🚧 File/image support

## Examples

See the [examples directory](./examples) for complete examples:
- Basic messaging
- React integration
- TanStack Router setup
- Custom processors
- Advanced event handling

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for details.

## License

GPL-3.0-only - See [LICENSE](./LICENSE) for details.

## Support

- 📖 [Documentation](https://js.meshtastic.org)
- 💬 [Discord](https://discord.gg/meshtastic)
- 🐛 [Issues](https://github.com/meshtastic/web/issues)
- 📧 [Email](mailto:support@meshtastic.org)
