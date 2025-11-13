import { toast } from "@core/hooks/useToast";
import type { MeshtasticClient } from "@meshtastic/client-sdk";

/**
 * Subscribe to SDK error events and show user notifications
 * Specifically handles "Device not connected" scenarios with friendly messages
 */
export function setupSDKNotifications(client: MeshtasticClient): () => void {
  // Subscribe to error events
  const unsubscribe = client.events.onError.subscribe((event) => {
    const { error, context } = event;

    // Handle device not connected errors
    if (error.message === "Device not connected") {
      toast({
        title: "Device not connected",
        description:
          "Cannot perform this action without an active device connection. Please connect a device first.",
        variant: "destructive",
      });
      return;
    }

    // Handle other errors with context
    const contextMessage = context ? ` (${context})` : "";
    toast({
      title: "Error",
      description: `${error.message}${contextMessage}`,
      variant: "destructive",
    });
  });

  // Return cleanup function
  return unsubscribe;
}

/**
 * Show a notification when attempting to use messaging features without a device
 */
export function notifyNoDeviceForMessaging(): void {
  toast({
    title: "No device connected",
    description:
      "You need to connect a device before you can send messages. Go to Connections to add a device.",
    variant: "destructive",
  });
}

/**
 * Show a notification when a device is successfully connected
 */
export function notifyDeviceConnected(deviceId: number): void {
  toast({
    title: "Device connected",
    description: `Device ${deviceId} is now connected and ready to use.`,
    variant: "default",
  });
}

/**
 * Show a notification when a device is disconnected
 */
export function notifyDeviceDisconnected(): void {
  toast({
    title: "Device disconnected",
    description: "The device has been disconnected.",
    variant: "default",
  });
}
