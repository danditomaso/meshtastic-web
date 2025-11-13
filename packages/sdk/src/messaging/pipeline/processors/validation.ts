// src/pipeline/processors/validation.ts
import type { MessageProcessor } from "../types.ts";

export const validateMessage = (): MessageProcessor => {
  return (ctx) => {
    const { message } = ctx;

    if (!message.content) {
      throw new Error("Message content is required");
    }

    if (typeof message.content === "string") {
      const byteLength = new TextEncoder().encode(message.content).length;
      if (byteLength > 200) {
        throw new Error(`Message exceeds 200 bytes (${byteLength} bytes)`);
      }
    }

    return ctx;
  };
};

// src/pipeline/processors/encryption.ts
export const checkEncryption = (): MessageProcessor => {
  return (ctx) => {
    const { message, metadata } = ctx;

    // Store encryption status in state for UI/logging
    const hasPublicKey = !!metadata.publicKey?.length;
    ctx.state.set("encrypted", hasPublicKey);
    ctx.state.set("encryptionType", hasPublicKey ? "PKI" : "PSK");

    return ctx;
  };
};

// src/pipeline/processors/routing.ts
export const handleRouting = (): MessageProcessor => {
  return async (ctx) => {
    const { message } = ctx;

    // Check if destination is reachable
    // This would integrate with your route tracking
    ctx.state.set("routingChecked", true);

    return ctx;
  };
};

// src/pipeline/processors/persistence.ts
export const persistMessage = (
  saveFn: (message: MeshMessage) => Promise<void>,
): MessageProcessor => {
  return async (ctx) => {
    await saveFn(ctx.message);
    ctx.state.set("persisted", true);
    return ctx;
  };
};

// src/pipeline/processors/unread.ts
export const trackUnread = (
  incrementFn: (identifier: number) => void,
): MessageProcessor => {
  return (ctx) => {
    const { message, metadata } = ctx;

    // Only increment for incoming messages
    if (message.from !== metadata.myNodeNum) {
      if (message.to === "broadcast") {
        incrementFn(message.channel);
      } else if (message.to === metadata.myNodeNum) {
        incrementFn(message.from);
      }
    }

    return ctx;
  };
};
