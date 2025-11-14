import { useCallback, useEffect, useMemo, useState } from "react";

export type AudioOutputDevice = {
  id: string;
  label: string;
  isDefault: boolean;
};

function canUseSetSinkId(): boolean {
  if (typeof window === "undefined") return false;
  const proto = window.HTMLMediaElement?.prototype as
    | (HTMLMediaElement & { setSinkId?: unknown })
    | undefined;
  return typeof proto?.setSinkId === "function";
}

const UNKNOWN_LABEL = "Unknown output";
const DEFAULT_LABEL = "System default";

export function useAudioOutputs() {
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [isEnumerating, setIsEnumerating] = useState(false);

  const enumerate = useCallback(async () => {
    setIsEnumerating(true);

    try {
      const outputs = await listAudioDevices();
      setAudioOutputs(outputs ?? []);
    } catch (err) {
      console.warn("Failed to enumerate audio outputs", err);
      setAudioOutputs([]);
    } finally {
      setIsEnumerating(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const media = navigator.mediaDevices;

    const refresh = async () => {
      if (cancelled) return;
      await enumerate();
    };

    void refresh();
    media?.addEventListener?.("devicechange", refresh);

    return () => {
      cancelled = true;
      media?.removeEventListener?.("devicechange", refresh);
    };
  }, [enumerate]);

  const supportsOutputSelection = useMemo(() => canUseSetSinkId(), []);

  return {
    audioOutputs,
    isEnumerating,
    supportsOutputSelection,
    refreshAudioOutputs: enumerate,
  };
}

async function listAudioDevices() {
  const mediaDevices = navigator.mediaDevices;
  if (!mediaDevices || !mediaDevices.enumerateDevices) return undefined;

  const devices = await mediaDevices.enumerateDevices();
  const groupKeys = new Set<string>();
  const outputs = devices
    .filter((device) => device.kind === "audiooutput")
    .filter((device) => {
      if (groupKeys.has(device.groupId)) return false;

      groupKeys.add(device.groupId);
      return true;
    });

  return outputs;
}
