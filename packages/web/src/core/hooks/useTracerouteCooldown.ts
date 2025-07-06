import { useEffect, useState } from "react";
import { useDevice } from "@core/stores/deviceStore.ts";

const TRACEROUTE_COOLDOWN_MS = 30000; // 30 seconds

export const useTracerouteCooldown = () => {
  const {
    getTracerouteCooldown,
    isTracerouteCooldownActive,
    setTracerouteCooldown,
  } = useDevice();
  const [remainingTime, setRemainingTime] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const cooldownEnd = getTracerouteCooldown();
      const now = Date.now();
      const remaining = Math.max(0, cooldownEnd - now);

      setRemainingTime(remaining);

      if (remaining > 0) {
        const elapsed = TRACEROUTE_COOLDOWN_MS - remaining;
        const progressPercent = (elapsed / TRACEROUTE_COOLDOWN_MS) * 100;
        setProgress(Math.min(100, Math.max(0, progressPercent)));
      } else {
        setProgress(0);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [getTracerouteCooldown]);

  const startCooldown = () => {
    const cooldownEnd = Date.now() + TRACEROUTE_COOLDOWN_MS;
    setTracerouteCooldown(cooldownEnd);
  };

  const isActive = isTracerouteCooldownActive();

  return {
    isActive,
    remainingTime,
    progress,
    startCooldown,
    cooldownDuration: TRACEROUTE_COOLDOWN_MS,
  };
};
