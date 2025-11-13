import type { MeshtasticClient } from "@meshtastic/client-sdk";

/**
 * Router context type definition
 * This is used by TanStack Router for type-safe context access
 */
export interface RouterContext {
  meshtastic: MeshtasticClient;
}

/**
 * Create the Meshtastic context for the router
 * This is a simple factory pattern that can be extended later
 */
export function createMeshtasticContext(
  client: MeshtasticClient,
): RouterContext {
  return {
    meshtastic: client,
  };
}
