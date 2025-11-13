import { MeshtasticClient } from "@meshtastic/client-sdk";

let meshtasticClient: MeshtasticClient | null = null;

/**
 * Create the Meshtastic client (without device - for router context)
 * Safe to call multiple times - returns existing instance
 */
export function createMeshtasticClient(options?: {
  enablePersistence?: boolean;
  messageRetentionLimit?: number;
}): MeshtasticClient {
  if (meshtasticClient) {
    return meshtasticClient;
  }

  meshtasticClient = new MeshtasticClient({
    enablePersistence: options?.enablePersistence ?? true,
    messageRetentionLimit: options?.messageRetentionLimit ?? 1000,
  });

  // Set up global event listeners
  meshtasticClient.events.onMessageReceived.subscribe((event) => {
    console.log("📩 New message:", event.message);
  });

  meshtasticClient.events.onError.subscribe((event) => {
    console.error("❌ Meshtastic error:", event.error);
  });

  return meshtasticClient;
}

/**
 * Get the Meshtastic client as router context
 * This destructures the client into individual sub-clients
 *
 * Auto-creates client if it doesn't exist (lazy initialization)
 * The client will exist but may not be initialized with a device yet
 */
export function getMeshtasticContext(): import("./types").RouterContext {
  // Lazy-create client if it doesn't exist
  if (!meshtasticClient) {
    createMeshtasticClient();
  }

  return {
    // Primary clients for easy access
    messages: meshtasticClient.messages,
    events: meshtasticClient.events,
    // nodes: meshtasticClient.nodes,      // TODO: Add when implemented
    // channels: meshtasticClient.channels, // TODO: Add when implemented
    // config: meshtasticClient.config,    // TODO: Add when implemented

    // Full client for advanced use
    client: meshtasticClient!,
  };
}

/**
 * Cleanup Meshtastic client
 */
export async function cleanupMeshtastic(): Promise<void> {
  if (meshtasticClient) {
    await meshtasticClient.shutdown();
    meshtasticClient = null;
  }
}

/**
 * Manually set the client (for testing)
 */
export function setMeshtastic(client: MeshtasticClient | null): void {
  meshtasticClient = client;
}
