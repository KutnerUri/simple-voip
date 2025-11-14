import { useCallback, useEffect, useState } from "react";

export const DEFAULT_AUDIO_SINK_ID = "default";

export function useOutputDeviceSelector(audioOutputs: MediaDeviceInfo[]) {
  const [selectedSinkId, setSelectedSinkId] = useState<string>(
    DEFAULT_AUDIO_SINK_ID,
  );

  useEffect(() => {
    if (!audioOutputs.length) {
      setSelectedSinkId(DEFAULT_AUDIO_SINK_ID);
      return;
    }
    if (audioOutputs.some((device) => device.deviceId === selectedSinkId))
      return;
    setSelectedSinkId(getDeviceSinkId(audioOutputs[0]));
  }, [audioOutputs, selectedSinkId]);

  const toggleAudio = useCallback(() => {
    if (!audioOutputs.length) return;
    const currentIndex = audioOutputs.findIndex(
      (device) => device.deviceId === selectedSinkId,
    );
    const nextIndex = (currentIndex + 1) % audioOutputs.length;
    setSelectedSinkId(getDeviceSinkId(audioOutputs[nextIndex]));
  }, [audioOutputs, selectedSinkId]);

  const selectedOutputDevice =
    audioOutputs.find((device) => device.deviceId === selectedSinkId) ?? null;

  return {
    selectedOutputDevice,
    selectedSinkId,
    toggleAudio,
  };
}

function getDeviceSinkId(device?: MediaDeviceInfo | null): string {
  if (!device) return DEFAULT_AUDIO_SINK_ID;
  return device.deviceId && device.deviceId.length > 0
    ? device.deviceId
    : DEFAULT_AUDIO_SINK_ID;
}
