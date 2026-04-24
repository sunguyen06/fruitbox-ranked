"use client";

import "client-only";

import { useEffect, useState } from "react";

const SOUND_EFFECTS_VOLUME_STORAGE_KEY = "fruitbox:sound-effects-volume";
const SOUND_EFFECTS_VOLUME_EVENT = "fruitbox:sound-effects-volume";
const DEFAULT_SOUND_EFFECTS_VOLUME = 0.7;

let cachedVolume = DEFAULT_SOUND_EFFECTS_VOLUME;
let hasLoadedStoredVolume = false;
let sharedAudioContext: AudioContext | null = null;

export function useSoundEffectsVolume() {
  const [volume, setVolumeState] = useState(() => loadSoundEffectsVolume());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleVolumeEvent = (event: Event) => {
      const nextVolume =
        event instanceof CustomEvent && typeof event.detail === "number"
          ? clampVolume(event.detail)
          : loadSoundEffectsVolume();

      setVolumeState(nextVolume);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== SOUND_EFFECTS_VOLUME_STORAGE_KEY) {
        return;
      }

      setVolumeState(loadSoundEffectsVolume());
    };

    window.addEventListener(SOUND_EFFECTS_VOLUME_EVENT, handleVolumeEvent as EventListener);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        SOUND_EFFECTS_VOLUME_EVENT,
        handleVolumeEvent as EventListener,
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return {
    volume,
    setVolume(nextVolume: number) {
      setSoundEffectsVolume(nextVolume);
      setVolumeState(clampVolume(nextVolume));
    },
  };
}

export function getSoundEffectsVolume() {
  return loadSoundEffectsVolume();
}

export function setSoundEffectsVolume(nextVolume: number) {
  const normalizedVolume = clampVolume(nextVolume);

  cachedVolume = normalizedVolume;
  hasLoadedStoredVolume = true;

  if (typeof window === "undefined") {
    return normalizedVolume;
  }

  window.localStorage.setItem(
    SOUND_EFFECTS_VOLUME_STORAGE_KEY,
    normalizedVolume.toString(),
  );
  window.dispatchEvent(
    new CustomEvent<number>(SOUND_EFFECTS_VOLUME_EVENT, {
      detail: normalizedVolume,
    }),
  );

  return normalizedVolume;
}

export function ensureSharedAudioContext() {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextConstructor = getAudioContextConstructor(window);

  if (!AudioContextConstructor) {
    return null;
  }

  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextConstructor();
  }

  return sharedAudioContext;
}

export function unlockSoundEffects() {
  const audioContext = ensureSharedAudioContext();

  if (audioContext?.state === "suspended") {
    void audioContext.resume().catch(() => {
      // Browser autoplay policies may still require another trusted gesture.
    });
  }
}

function loadSoundEffectsVolume() {
  if (hasLoadedStoredVolume || typeof window === "undefined") {
    return cachedVolume;
  }

  hasLoadedStoredVolume = true;
  const storedValue = window.localStorage.getItem(SOUND_EFFECTS_VOLUME_STORAGE_KEY);

  if (!storedValue) {
    return cachedVolume;
  }

  const parsedValue = Number(storedValue);

  if (!Number.isFinite(parsedValue)) {
    return cachedVolume;
  }

  cachedVolume = clampVolume(parsedValue);
  return cachedVolume;
}

function clampVolume(value: number) {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : DEFAULT_SOUND_EFFECTS_VOLUME));
}

interface AudioContextWindow extends Window {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

function getAudioContextConstructor(
  audioWindow: AudioContextWindow,
): typeof AudioContext | null {
  return audioWindow.AudioContext ?? audioWindow.webkitAudioContext ?? null;
}
