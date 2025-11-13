import type {
  EventBus,
  MeshtasticClient,
  MessagingClient,
} from "@meshtastic/client-sdk";

/**
 * Router context type for TanStack Router
 * Provides direct access to SDK sub-clients
 *
 * NOTE: messages will be undefined until a device is connected
 * Check if messages exists to determine if device is ready
 */
export interface RouterContext {
  // Primary clients (may be undefined before device connection)
  messages?: MessagingClient;
  events: EventBus;
  // nodes: NodeClient;      // TODO: uncomment when implemented
  // channels: ChannelClient; // TODO: uncomment when implemented
  // config: ConfigClient;    // TODO: uncomment when implemented

  // Full client access for advanced use
  client: MeshtasticClient;
}

/**
 * Type-safe hook to access Meshtastic context from routes
 * Use this instead of useRouteContext for better type inference
 */
export type { MessagingClient, EventBus, MeshtasticClient };
