import { useEffect, useRef } from "react";

type Props = {
  stream: MediaStream;
  output?: MediaDeviceInfo | null;
  autoPlay?: boolean;
};

const DEFAULT_SINK_ID = "default";

export function AudioOutput({ stream, output, autoPlay = true }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.srcObject !== stream) {
      el.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (!output) return;
    const el = audioRef.current as
      | (HTMLAudioElement & {
          setSinkId?: (sinkId: string) => Promise<void>;
        })
      | null;
    if (!el || typeof el.setSinkId !== "function") return;
    const sinkId = resolveSinkId(output);
    void el.setSinkId(sinkId).catch((err) => {
      console.warn("Failed to set audio output device", err);
    });
  }, [output]);

  return <audio ref={audioRef} autoPlay={autoPlay} />;
}

function resolveSinkId(device?: MediaDeviceInfo | null): string {
  if (!device) return DEFAULT_SINK_ID;
  return device.deviceId && device.deviceId.length > 0
    ? device.deviceId
    : DEFAULT_SINK_ID;
}
