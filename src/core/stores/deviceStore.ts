import { create } from "@bufbuild/protobuf";
import { MeshDevice, Protobuf, Types } from "@meshtastic/core";
import { produce } from "immer";
import { createContext, useContext } from "react";
import { create as createStore } from "zustand";
import { Message, MessageQueueItem, MessageType } from "@core/services/types.ts";
import { randId } from "@core/utils/randId.ts";

export type Page = "messages" | "map" | "config" | "channels" | "nodes";

export type MessageState = "ack" | "waiting" | Protobuf.Mesh.Routing_Error;

export interface ProcessPacketParams {
  from: number;
  snr: number;
  time: number;
}

export type DialogVariant =
  | "import"
  | "QR"
  | "shutdown"
  | "reboot"
  | "deviceName"
  | "nodeRemoval"
  | "pkiBackup"
  | "nodeDetails"
  | "unsafeRoles";

type QueueStatus = {
  res: number, free: number, maxlen: number
}

export interface Device {
  id: number;
  status: Types.DeviceStatusEnum;
  channels: Map<Types.ChannelNumber, Protobuf.Channel.Channel>;
  config: Protobuf.LocalOnly.LocalConfig;
  moduleConfig: Protobuf.LocalOnly.LocalModuleConfig;
  workingConfig: Protobuf.Config.Config[];
  workingModuleConfig: Protobuf.ModuleConfig.ModuleConfig[];
  hardware: Protobuf.Mesh.MyNodeInfo;
  nodes: Map<number, Protobuf.Mesh.NodeInfo>;
  metadata: Map<number, Protobuf.Mesh.DeviceMetadata>;
  messages: {
    direct: Map<number, Message[]>;
    broadcast: Map<Types.ChannelNumber, Message[]>;
  };
  traceroutes: Map<
    number,
    Types.PacketMetadata<Protobuf.Mesh.RouteDiscovery>[]
  >;
  connection?: MeshDevice;
  activePage: Page;
  activeNode: number;
  waypoints: Protobuf.Mesh.Waypoint[];
  // currentMetrics: Protobuf.DeviceMetrics;
  pendingSettingsChanges: boolean;
  messageDraft: string;
  queueStatus: QueueStatus;
  messageQueue: MessageQueueItem[];
  processor?: (item: MessageQueueItem) => Promise<void>;
  isProcessing: boolean;
  dialog: {
    import: boolean;
    QR: boolean;
    shutdown: boolean;
    reboot: boolean;
    deviceName: boolean;
    nodeRemoval: boolean;
    pkiBackup: boolean;
    nodeDetails: boolean;
    unsafeRoles: boolean;
  };

  setStatus: (status: Types.DeviceStatusEnum) => void;
  setConfig: (config: Protobuf.Config.Config) => void;
  setModuleConfig: (config: Protobuf.ModuleConfig.ModuleConfig) => void;
  setWorkingConfig: (config: Protobuf.Config.Config) => void;
  setWorkingModuleConfig: (config: Protobuf.ModuleConfig.ModuleConfig) => void;
  setHardware: (hardware: Protobuf.Mesh.MyNodeInfo) => void;
  // setMetrics: (metrics: Types.PacketMetadata<Protobuf.Telemetry>) => void;
  setActivePage: (page: Page) => void;
  setActiveNode: (node: number) => void;
  setPendingSettingsChanges: (state: boolean) => void;
  addChannel: (channel: Protobuf.Channel.Channel) => void;
  addWaypoint: (waypoint: Protobuf.Mesh.Waypoint) => void;
  addNodeInfo: (nodeInfo: Protobuf.Mesh.NodeInfo) => void;
  addUser: (user: Types.PacketMetadata<Protobuf.Mesh.User>) => void;
  addPosition: (position: Types.PacketMetadata<Protobuf.Mesh.Position>) => void;
  addConnection: (connection: MeshDevice) => void;
  addTraceRoute: (
    traceroute: Types.PacketMetadata<Protobuf.Mesh.RouteDiscovery>,
  ) => void;
  addMetadata: (from: number, metadata: Protobuf.Mesh.DeviceMetadata) => void;
  removeNode: (nodeNum: number) => void;

  setDialogOpen: (dialog: DialogVariant, open: boolean) => void;
  getDialogOpen: (dialog: DialogVariant) => boolean;
  processPacket: (data: ProcessPacketParams) => void;
  setMessageDraft: (message: string) => void;

  /** Message processing */
  // setMessageState: (
  //   type: "direct" | "broadcast",
  //   channelIndex: Types.ChannelNumber,
  //   to: number,
  //   from: number,
  //   messageId: number,
  //   state: MessageState,
  // ) => void;
  updateMessageStatus: (messageId: number, newState: MessageState) => void;
  saveMessage: (message: Message) => void;
  setProcessor: (processor: (item: MessageQueueItem) => Promise<void>) => void;
  sendText: (text: string, to: number, channel: number, type: MessageType) => number;
  sendTextDirectly: (text: string, to: number, channel?: number) => Promise<number>;
  processQueue: () => Promise<void>;
  removeFromQueue: (id: number) => void;
  updateQueueStatus: (status: QueueStatus) => void;
}

export interface DeviceState {
  devices: Map<number, Device>;
  remoteDevices: Map<number, undefined>;

  addDevice: (id: number) => Device;
  removeDevice: (id: number) => void;
  getDevices: () => Device[];
  getDevice: (id: number) => Device | undefined;
}

export const useDeviceStore = createStore<DeviceState>((set, get) => ({
  devices: new Map(),
  remoteDevices: new Map(),

  addDevice: (id: number) => {
    set(
      produce<DeviceState>((draft) => {
        draft.devices.set(id, {
          id,
          status: Types.DeviceStatusEnum.DeviceDisconnected,
          channels: new Map(),
          config: create(Protobuf.LocalOnly.LocalConfigSchema),
          moduleConfig: create(Protobuf.LocalOnly.LocalModuleConfigSchema),
          workingConfig: [],
          workingModuleConfig: [],
          hardware: create(Protobuf.Mesh.MyNodeInfoSchema),
          nodes: new Map(),
          metadata: new Map(),
          messages: {
            direct: new Map(),
            broadcast: new Map(),
          },
          traceroutes: new Map(),
          connection: undefined,
          activePage: "messages",
          activeNode: 0,
          waypoints: [],
          queueStatus: {
            res: 0, free: 0, maxlen: 0
          },
          messageQueue: [],
          isProcessing: false,
          dialog: {
            import: false,
            QR: false,
            shutdown: false,
            reboot: false,
            deviceName: false,
            nodeRemoval: false,
            pkiBackup: false,
            nodeDetails: false,
            unsafeRoles: false,
          },
          pendingSettingsChanges: false,
          messageDraft: "",

          setProcessor: (processor) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (device) device.processor = processor;
              })
            );
          },

          sendText: (text: string, to: number, channel = 0, type: MessageType = to === 0 ? "broadcast" : "direct"): number => {
            console.log("sendText called", text);
            let messageItem: MessageQueueItem | undefined;
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (!device) {
                  return;
                }

                messageItem = {
                  id: randId(),
                  data: {
                    messageId: randId(),
                    message: text,
                    from: device.hardware?.myNodeNum ?? 0,
                    to,
                    date: new Date(),
                    state: "waiting",
                    channel,
                    type,
                  },
                };

                device.messageQueue.push(messageItem);
              })
            );

            const device = get().devices.get(id);
            if (device) {
              device.processQueue();
            }

            return messageItem?.id ?? -1; // Fallback value if messageItem is undefined
          },

          // sendTextDirectly: (text, to = 0, channel = 0) => {
          //   const device = get().devices.get(id);
          //   if (!device || !device.connection) {
          //     return;
          //   }

          //   try {
          //     device.connection.sendText(text, to, true, channel);
          //   } catch (error) {
          //     console.error("Error sending message:", error);
          //   }
          // },

          processQueue: async () => {
            const device = get().devices.get(id);

            // Exit early if no processing needed
            if (!device || device.isProcessing || device.messageQueue.length === 0) return;

            // Mark as processing
            set(produce<DeviceState>((draft) => {
              const device = draft.devices.get(id);
              if (device) device.isProcessing = true;
            }));

            try {
              // Process a single message from the queue
              const currentItem = device.messageQueue[0];

              // Remove item from queue first to prevent duplicate processing
              set(produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (device) device.messageQueue = device.messageQueue.slice(1);
              }));

              // Apply backoff if needed
              if (device.queueStatus.free <= 10) {
                const backoffTime = Math.min(1000 * (11 - device.queueStatus.free), 2000);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
              } else if (device.queueStatus.free <= 15) {
                await new Promise(resolve => setTimeout(resolve, 200));
              }

              // Send the message to the radio
              const messageId = await device.connection?.sendText(
                currentItem.data.message,
                currentItem.data.to,
                true,
                currentItem.data.channel
              );

              if (messageId !== undefined) {
                device.updateMessageStatus(messageId, "ack");
                console.log(`Message sent: ${currentItem.data.message}`);
              } else {
                console.warn(`Failed to send message: ${currentItem.data.message}`);
              }
            } catch (error) {
              console.error('Error processing message queue:', error);
            } finally {
              // Reset processing flag
              set(produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (device) device.isProcessing = false;
              }));

              // Check if more messages need processing
              if (device.messageQueue.length > 0) {
                setTimeout(() => device.processQueue(), 100);
              }
            }
          },
          updateMessageStatus: (messageId: number, newState: MessageState) => {
            set(
              produce<DeviceState>((draft) => {
                for (const device of draft.devices.values()) {
                  const messages = [...device.messages.direct.values(), ...device.messages.broadcast.values()];

                  // Find the message in the merged direct/broadcast array
                  const message = messages.find((msg) => msg.messageId === messageId);

                  if (message) {
                    message.state = newState;
                    return;
                  }
                }
              })
            );
          },

          removeFromQueue: (id: number) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (device) {
                  device.messageQueue = device.messageQueue.filter((msg) => msg.id !== id);
                }
              })
            );
          },
          updateQueueStatus: (status) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (device) device.queueStatus = status;
              })
            );
          },
          setStatus: (status: Types.DeviceStatusEnum) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (device) {
                  device.status = status;
                }
              }),
            );
          },
          setConfig: (config: Protobuf.Config.Config) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);

                if (device) {
                  switch (config.payloadVariant.case) {
                    case "device": {
                      device.config.device = config.payloadVariant.value;
                      break;
                    }
                    case "position": {
                      device.config.position = config.payloadVariant.value;
                      break;
                    }
                    case "power": {
                      device.config.power = config.payloadVariant.value;
                      break;
                    }
                    case "network": {
                      device.config.network = config.payloadVariant.value;
                      break;
                    }
                    case "display": {
                      device.config.display = config.payloadVariant.value;
                      break;
                    }
                    case "lora": {
                      device.config.lora = config.payloadVariant.value;
                      break;
                    }
                    case "bluetooth": {
                      device.config.bluetooth = config.payloadVariant.value;
                      break;
                    }
                    case "security": {
                      device.config.security = config.payloadVariant.value;
                    }
                  }
                }
              }),
            );
          },
          setModuleConfig: (config: Protobuf.ModuleConfig.ModuleConfig) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);

                if (device) {
                  switch (config.payloadVariant.case) {
                    case "mqtt": {
                      device.moduleConfig.mqtt = config.payloadVariant.value;
                      break;
                    }
                    case "serial": {
                      device.moduleConfig.serial = config.payloadVariant.value;
                      break;
                    }
                    case "externalNotification": {
                      device.moduleConfig.externalNotification =
                        config.payloadVariant.value;
                      break;
                    }
                    case "storeForward": {
                      device.moduleConfig.storeForward =
                        config.payloadVariant.value;
                      break;
                    }
                    case "rangeTest": {
                      device.moduleConfig.rangeTest =
                        config.payloadVariant.value;
                      break;
                    }
                    case "telemetry": {
                      device.moduleConfig.telemetry =
                        config.payloadVariant.value;
                      break;
                    }
                    case "cannedMessage": {
                      device.moduleConfig.cannedMessage =
                        config.payloadVariant.value;
                      break;
                    }
                    case "audio": {
                      device.moduleConfig.audio = config.payloadVariant.value;
                      break;
                    }
                    case "neighborInfo": {
                      device.moduleConfig.neighborInfo =
                        config.payloadVariant.value;
                      break;
                    }
                    case "ambientLighting": {
                      device.moduleConfig.ambientLighting =
                        config.payloadVariant.value;
                      break;
                    }
                    case "detectionSensor": {
                      device.moduleConfig.detectionSensor =
                        config.payloadVariant.value;
                      break;
                    }
                    case "paxcounter": {
                      device.moduleConfig.paxcounter =
                        config.payloadVariant.value;
                      break;
                    }
                  }
                }
              }),
            );
          },
          setWorkingConfig: (config: Protobuf.Config.Config) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (!device) {
                  return;
                }
                const workingConfigIndex = device?.workingConfig.findIndex(
                  (wc) => wc.payloadVariant.case === config.payloadVariant.case,
                );
                if (workingConfigIndex !== -1) {
                  device.workingConfig[workingConfigIndex] = config;
                } else {
                  device?.workingConfig.push(config);
                }
              }),
            );
          },
          setWorkingModuleConfig: (
            moduleConfig: Protobuf.ModuleConfig.ModuleConfig,
          ) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (!device) {
                  return;
                }
                const workingModuleConfigIndex = device?.workingModuleConfig
                  .findIndex(
                    (wmc) =>
                      wmc.payloadVariant.case ===
                      moduleConfig.payloadVariant.case,
                  );
                if (workingModuleConfigIndex !== -1) {
                  device.workingModuleConfig[workingModuleConfigIndex] =
                    moduleConfig;
                } else {
                  device?.workingModuleConfig.push(moduleConfig);
                }
              }),
            );
          },
          setHardware: (hardware: Protobuf.Mesh.MyNodeInfo) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (device) {
                  device.hardware = hardware;
                }
              }),
            );
          },
          // setMetrics: (metrics: Types.PacketMetadata<Protobuf.Telemetry>) => {
          //   set(
          //     produce<DeviceState>((draft) => {
          //       const device = draft.devices.get(id);
          //       let node = device?.nodes.find(
          //         (n) => n.data.num === metrics.from
          //       );
          //       if (node) {
          //         switch (metrics.data.variant.case) {
          //           case "deviceMetrics":
          //             if (device) {
          //               if (metrics.data.variant.value.batteryLevel) {
          //                 device.currentMetrics.batteryLevel =
          //                   metrics.data.variant.value.batteryLevel;
          //               }
          //               if (metrics.data.variant.value.voltage) {
          //                 device.currentMetrics.voltage =
          //                   metrics.data.variant.value.voltage;
          //               }
          //               if (metrics.data.variant.value.airUtilTx) {
          //                 device.currentMetrics.airUtilTx =
          //                   metrics.data.variant.value.airUtilTx;
          //               }
          //               if (metrics.data.variant.value.channelUtilization) {
          //                 device.currentMetrics.channelUtilization =
          //                   metrics.data.variant.value.channelUtilization;
          //               }
          //             }
          //             node.deviceMetrics.push({
          //               metric: metrics.data.variant.value,
          //               timestamp: metrics.rxTime
          //             });
          //             break;
          //           case "environmentMetrics":
          //             node.environmentMetrics.push({
          //               metric: metrics.data.variant.value,
          //               timestamp: metrics.rxTime
          //             });
          //             break;
          //         }
          //       }
          //     })
          //   );
          // },
          setActivePage: (page) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (device) {
                  device.activePage = page;
                }
              }),
            );
          },
          setPendingSettingsChanges: (state) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (device) {
                  device.pendingSettingsChanges = state;
                }
              }),
            );
          },
          addChannel: (channel: Protobuf.Channel.Channel) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (!device) {
                  return;
                }
                device.channels.set(channel.index, channel);
              }),
            );
          },
          addWaypoint: (waypoint: Protobuf.Mesh.Waypoint) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (device) {
                  const waypointIndex = device.waypoints.findIndex(
                    (wp) => wp.id === waypoint.id,
                  );

                  if (waypointIndex !== -1) {
                    device.waypoints[waypointIndex] = waypoint;
                  } else {
                    device.waypoints.push(waypoint);
                  }
                }
              }),
            );
          },
          addNodeInfo: (nodeInfo) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (!device) {
                  return;
                }
                device.nodes.set(nodeInfo.num, nodeInfo);
              }),
            );
          },
          setActiveNode: (node) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (device) {
                  device.activeNode = node;
                }
              }),
            );
          },
          addUser: (user) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (!device) {
                  return;
                }
                const currentNode = device.nodes.get(user.from) ??
                  create(Protobuf.Mesh.NodeInfoSchema);
                currentNode.user = user.data;
                device.nodes.set(user.from, currentNode);
              }),
            );
          },
          addPosition: (position) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (!device) {
                  return;
                }
                const currentNode = device.nodes.get(position.from) ??
                  create(Protobuf.Mesh.NodeInfoSchema);
                currentNode.position = position.data;
                device.nodes.set(position.from, currentNode);
              }),
            );
          },
          addConnection: (connection) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (device) {
                  device.connection = connection;
                }
              }),
            );
          },
          saveMessage: (message) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (!device) {
                  return;
                }
                const messageGroup = device.messages[message.type];
                const messageIndex = message.type === "direct"
                  ? message.from === device.hardware.myNodeNum
                    ? message.to
                    : message.from
                  : message.channel;
                const messages = messageGroup.get(messageIndex);

                console.log('incoming message', message);


                if (messages) {
                  messages.push(message);
                  messageGroup.set(messageIndex, messages);
                } else {
                  messageGroup.set(messageIndex, [message]);
                }
              }),
            );
          },

          addMetadata: (from, metadata) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (!device) {
                  return;
                }
                device.metadata.set(from, metadata);
              }),
            );
          },
          addTraceRoute: (traceroute) => {
            set(
              produce<DeviceState>((draft) => {
                console.log("addTraceRoute called");
                const device = draft.devices.get(id);
                if (!device) {
                  return;
                }

                const nodetraceroutes = device.traceroutes.get(traceroute.from);
                if (nodetraceroutes) {
                  nodetraceroutes.push(traceroute);
                  device.traceroutes.set(traceroute.from, nodetraceroutes);
                } else {
                  device.traceroutes.set(traceroute.from, [traceroute]);
                }
              }),
            );
          },
          removeNode: (nodeNum) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (!device) {
                  return;
                }
                device.nodes.delete(nodeNum);
              }),
            );
          },
          setMessageState: (
            type: "direct" | "broadcast",
            channelIndex: Types.ChannelNumber,
            to: number,
            from: number,
            messageId: number,
            state: MessageState,
          ) => {
            set(
              produce<DeviceState>((draft) => {
                console.log("setMessageState called");
                const device = draft.devices.get(id);
                if (!device) {
                  console.log("no device found for id");
                  return;
                }
                const messageGroup = device.messages[type];

                const messageIndex = type === "direct"
                  ? from === device.hardware.myNodeNum ? to : from
                  : channelIndex;
                const messages = messageGroup.get(messageIndex);

                if (!messages) {
                  console.log("no messages found for id");
                  return;
                }

                messageGroup.set(
                  messageIndex,
                  messages.map((msg) => {
                    if (msg.id === messageId) {
                      msg.state = state;
                    }
                    return msg;
                  }),
                );
              }),
            );
          },
          setDialogOpen: (dialog: DialogVariant, open: boolean) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (!device) {
                  return;
                }
                device.dialog[dialog] = open;
              }),
            );
          },
          getDialogOpen: (dialog: DialogVariant) => {
            const device = get().devices.get(id);
            if (!device) {
              throw new Error("Device not found");
            }
            return device.dialog[dialog];
          },
          processPacket(data: ProcessPacketParams) {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (!device) {
                  return;
                }
                const node = device.nodes.get(data.from);
                if (node) {
                  device.nodes.set(data.from, {
                    ...node,
                    lastHeard: data.time,
                    snr: data.snr,
                  });
                } else {
                  device.nodes.set(
                    data.from,
                    create(Protobuf.Mesh.NodeInfoSchema, {
                      num: data.from,
                      lastHeard: data.time,
                      snr: data.snr,
                    }),
                  );
                }
              }),
            );
          },
          setMessageDraft: (message: string) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (device) {
                  device.messageDraft = message;
                }
              }),
            );
          },
        });
      }),
    );

    const device = get().devices.get(id);

    if (!device) {
      throw new Error("Device not found");
    }
    return device;
  },
  removeDevice: (id) => {
    set(
      produce<DeviceState>((draft) => {
        draft.devices.delete(id);
      }),
    );
  },

  getDevices: () => Array.from(get().devices.values()),

  getDevice: (id) => get().devices.get(id),
}));

export const DeviceContext = createContext<Device | undefined>(undefined);

export const useDevice = (): Device => {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error("useDevice must be used within a DeviceProvider");
  }
  return context;
};
