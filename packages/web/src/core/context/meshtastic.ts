import { MeshtasticClient } from "@meshtastic/client-sdk";
import {
  notifyDeviceConnected,
  notifyDeviceDisconnected,
  setupSDKNotifications,
} from "./notifications";

let meshtasticClient: MeshtasticClient | null = null;
let notificationCleanup: (() => void) | null = null;

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

  // Set up user notifications for SDK errors
  notificationCleanup = setupSDKNotifications(meshtasticClient);

  // Set up device connection/disconnection notifications
  meshtasticClient.events.onDeviceConnected.subscribe((event) => {
    notifyDeviceConnected(event.deviceId);
  });

  meshtasticClient.events.onDeviceDisconnected.subscribe(() => {
    notifyDeviceDisconnected();
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
 * Connect a MeshDevice to the global Meshtastic client
 * This initializes the MessageClient and subscribes to device events
 */
export async function connectMeshtasticDevice(
  device: import("@meshtastic/core").MeshDevice,
  deviceId: number,
  myNodeNum: number,
): Promise<void> {
  // Ensure client exists
  if (!meshtasticClient) {
    createMeshtasticClient();
  }

  // Connect the device to the client
  await meshtasticClient!.connectDevice(device, deviceId, myNodeNum);

  console.log(
    `[Meshtastic Context] Device ${deviceId} connected successfully`,
  );
}

/**
 * Disconnect the current device from the global Meshtastic client
 */
export async function disconnectMeshtasticDevice(): Promise<void> {
  if (meshtasticClient) {
    await meshtasticClient.disconnectDevice();
    console.log("[Meshtastic Context] Device disconnected");
  }
}

/**
 * Check if a device is currently connected
 */
export function isMeshtasticDeviceConnected(): boolean {
  return meshtasticClient?.isDeviceConnected() ?? false;
}

/**
 * Cleanup Meshtastic client
 */
export async function cleanupMeshtastic(): Promise<void> {
  if (notificationCleanup) {
    notificationCleanup();
    notificationCleanup = null;
  }

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
