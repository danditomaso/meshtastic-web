// hooks for accessing Meshtastic SDK

import { useRouteContext } from "@tanstack/react-router";
import type { RouterContext } from "./types.ts";

/**
 * Type-safe hook to access the full Meshtastic context
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { messages, events, client } = useMeshtasticContext();
 *   // Fully typed!
 * }
 * ```
 */
export function useMeshtasticContext(): RouterContext {
  return useRouteContext({ strict: false }) as RouterContext;
}

/**
 * Hook to access just the messaging client
 */
export function useMessaging() {
  const context = useMeshtasticContext();
  return context.messages;
}

/**
 * Hook to access just the event bus
 */
export function useEvents() {
  const context = useMeshtasticContext();
  return context.events;
}

/**
 * Hook to access the full client (for myNodeNum, etc.)
 */
export function useMeshtasticClient() {
  const context = useMeshtasticContext();
  return context.client;
}
