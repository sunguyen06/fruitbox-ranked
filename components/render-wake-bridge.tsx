"use client";

import { useEffect } from "react";

const WAKE_COOLDOWN_MS = 60_000;
const LAST_WAKE_KEY = "fruitbox-render-last-wake-at";

export function RenderWakeBridge() {
  useEffect(() => {
    void wakeIfNeeded();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void wakeIfNeeded();
      }
    };

    const handleFocus = () => {
      void wakeIfNeeded();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return null;
}

async function wakeIfNeeded() {
  const now = Date.now();
  const lastWakeAt = readLastWakeAt();

  if (now - lastWakeAt < WAKE_COOLDOWN_MS) {
    return;
  }

  writeLastWakeAt(now);

  try {
    await fetch("/api/render-wake", {
      method: "POST",
      keepalive: true,
    });
  } catch {
    // Ignore wake-up failures. The realtime connection flow will retry later.
  }
}

function readLastWakeAt(): number {
  try {
    const value = window.localStorage.getItem(LAST_WAKE_KEY);
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

function writeLastWakeAt(value: number) {
  try {
    window.localStorage.setItem(LAST_WAKE_KEY, String(value));
  } catch {
    // Ignore storage failures and allow the next foreground event to retry.
  }
}
