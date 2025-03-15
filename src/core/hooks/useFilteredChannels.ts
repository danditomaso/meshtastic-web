import { useMemo } from "react";
import { useDevice } from "@core/stores/deviceStore.ts";
import { Protobuf } from "@meshtastic/core";

export const useFilteredChannels = () => {
  const { channels } = useDevice();

  const filteredChannels = useMemo(() => {
    return Array.from(channels.values()).filter(
      (ch) => ch.role !== Protobuf.Channel.Channel_Role.DISABLED,
    );
  }, [channels]);

  return filteredChannels;
};