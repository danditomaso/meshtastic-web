import type { MeshDevice } from "@meshtastic/core";
import { MessagingClient } from "../messaging/MessageClient.ts";
import { MessageStoreManager } from "../messaging/MessageStoreManager.ts";
import { MessagePipeline } from "../messaging/pipeline/MessagePipeline.ts";
import { EventBus } from "../events/EventBus.ts";
// import { NodeClient } from "../nodes/NodeClient";
// import { ChannelClient } from "../channels/ChannelClient";
// import { ConfigClient } from "../config/ConfigClient";
// import { TelemetryClient } from "../telemetry/TelemetryClient";
// import { WaypointClient } from "../waypoints/WaypointClient";

export interface MeshtasticClientConfig {
  device: MeshDevice;
  deviceId: number;
  myNodeNum: number;
  enablePersistence?: boolean;
  storageKey?: string;
  messageRetentionLimit?: number;
}

export class MeshtasticClient {
  public readonly messages: MessagingClient;
  public readonly events: EventBus;
  // public readonly nodes: NodeClient;
  // public readonly channels: ChannelClient;
  // public readonly config: ConfigClient;
  // public readonly telemetry: TelemetryClient;
  // public readonly waypoints: WaypointClient;

  private device: MeshDevice;
  private deviceId: number;
  private myNodeNum: number;
  private messageStoreManager: MessageStoreManager;

  constructor(config: MeshtasticClientConfig) {
    this.device = config.device;
    this.deviceId = config.deviceId;
    this.myNodeNum = config.myNodeNum;

    // Initialize EventBus
    this.events = new EventBus();

    // Initialize message store manager with persistence
    this.messageStoreManager = new MessageStoreManager({
      enablePersistence: config.enablePersistence ?? false,
      storageKey: config.storageKey ?? "meshtastic-message-store",
      messageRetentionLimit: config.messageRetentionLimit ?? 1000,
      storeRetentionLimit: 10,
    });

    // Initialize messaging client with EventBus
    this.messages = new MessagingClient({
      device: this.device,
      deviceId: this.deviceId,
      myNodeNum: this.myNodeNum,
      storeManager: this.messageStoreManager,
      eventBus: this.events,
      pipeline: new MessagePipeline(),
    });

    // TODO: Initialize other clients when ready
    // this.nodes = new NodeClient({ ... });
    // this.channels = new ChannelClient({ ... });
    // this.config = new ConfigClient({ ... });
    // this.telemetry = new TelemetryClient({ ... });
    // this.waypoints = new WaypointClient({ ... });
  }

  async connect(): Promise<void> {
    this.subscribeToDeviceEvents();
  }

  async disconnect(): Promise<void> {
    // Force save any pending changes
    await this.messageStoreManager.forceSave();
    this.unsubscribeFromDeviceEvents();
  }

  async shutdown(): Promise<void> {
    await this.messageStoreManager.shutdown();
    this.events.dispose();
  }

  private subscribeToDeviceEvents(): void {
    // Subscribe to device events using @meshtastic/core event system
    // this.device.events.onMessagePacket.subscribe((packet) => {
    //   // Handle incoming messages
    // });
  }

  private unsubscribeFromDeviceEvents(): void {
    // Unsubscribe from device events
  }
}
