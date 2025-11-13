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
  device?: MeshDevice;
  deviceId?: number;
  myNodeNum?: number;
  enablePersistence?: boolean;
  storageKey?: string;
  messageRetentionLimit?: number;
}

export class MeshtasticClient {
  public messages?: MessagingClient;
  public readonly events: EventBus;
  // public readonly nodes: NodeClient;
  // public readonly channels: ChannelClient;
  // public readonly config: ConfigClient;
  // public readonly telemetry: TelemetryClient;
  // public readonly waypoints: WaypointClient;

  private device?: MeshDevice;
  private _deviceId?: number;
  private _myNodeNum?: number;
  private messageStoreManager: MessageStoreManager;

  constructor(config: MeshtasticClientConfig) {
    this.device = config.device;
    this._deviceId = config.deviceId;
    this._myNodeNum = config.myNodeNum;

    // Initialize EventBus (always available)
    this.events = new EventBus();

    // Initialize message store manager with persistence
    this.messageStoreManager = new MessageStoreManager({
      enablePersistence: config.enablePersistence ?? false,
      storageKey: config.storageKey ?? "meshtastic-message-store",
      messageRetentionLimit: config.messageRetentionLimit ?? 1000,
      storeRetentionLimit: 10,
    });

    // Only initialize messaging client if device is provided
    if (this.device && this._deviceId !== undefined && this._myNodeNum !== undefined) {
      this.messages = new MessagingClient({
        device: this.device,
        deviceId: this._deviceId,
        myNodeNum: this._myNodeNum,
        storeManager: this.messageStoreManager,
        eventBus: this.events,
        pipeline: new MessagePipeline(),
      });
    }

    // TODO: Initialize other clients when ready
    // this.nodes = new NodeClient({ ... });
    // this.channels = new ChannelClient({ ... });
    // this.config = new ConfigClient({ ... });
    // this.telemetry = new TelemetryClient({ ... });
    // this.waypoints = new WaypointClient({ ... });
  }

  /**
   * Check if a device is currently connected
   */
  isDeviceConnected(): boolean {
    return this.device !== undefined;
  }

  /**
   * Get the current device's myNodeNum (undefined if no device connected)
   */
  get myNodeNum(): number | undefined {
    return this._myNodeNum;
  }

  /**
   * Get the current device ID (undefined if no device connected)
   */
  get deviceId(): number | undefined {
    return this._deviceId;
  }

  /**
   * Connect a MeshDevice to this client
   * Creates MessageClient and subscribes to device events
   */
  async connectDevice(device: MeshDevice, deviceId: number, myNodeNum: number): Promise<void> {
    if (this.device) {
      throw new Error("Device already connected. Disconnect first.");
    }

    this.device = device;
    this._deviceId = deviceId;
    this._myNodeNum = myNodeNum;

    // Initialize messaging client
    this.messages = new MessagingClient({
      device: this.device,
      deviceId: this._deviceId,
      myNodeNum: this._myNodeNum,
      storeManager: this.messageStoreManager,
      eventBus: this.events,
      pipeline: new MessagePipeline(),
    });

    // Subscribe to device events
    this.subscribeToDeviceEvents();

    // Emit device connected event
    this.events.onDeviceConnected.dispatch({ deviceId });
  }

  /**
   * Disconnect the current device
   * Removes MessageClient and unsubscribes from events
   */
  async disconnectDevice(): Promise<void> {
    if (!this.device) {
      return; // Already disconnected
    }

    const deviceId = this._deviceId;

    // Force save any pending changes
    await this.messageStoreManager.forceSave();

    // Unsubscribe from device events
    this.unsubscribeFromDeviceEvents();

    // Clear device references
    this.device = undefined;
    this._deviceId = undefined;
    this._myNodeNum = undefined;
    this.messages = undefined;

    // Emit device disconnected event
    if (deviceId !== undefined) {
      this.events.onDeviceDisconnected.dispatch({ deviceId });
    }
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
