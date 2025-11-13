import classNames from "classnames";
import { useEffect, useState, type HTMLAttributes } from "react";

export type PeerStatus = "live" | "muted" | "ended" | "no-audio" | "unknown";

interface Props extends HTMLAttributes<HTMLDivElement> {
  stream: MediaStream | null;
  label?: string;
}

const STATUS_META: Record<
  PeerStatus,
  { label: string; dot: string; text: string }
> = {
  live: {
    label: "Live",
    dot: "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]",
    text: "text-emerald-300",
  },
  muted: {
    label: "Muted",
    dot: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]",
    text: "text-amber-300",
  },
  "no-audio": {
    label: "No audio",
    dot: "bg-neutral-400 shadow-[0_0_6px_rgba(163,163,163,0.6)]",
    text: "text-neutral-400",
  },
  ended: {
    label: "Ended",
    dot: "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]",
    text: "text-rose-400",
  },
  unknown: {
    label: "Unknown",
    dot: "bg-neutral-600 shadow-[0_0_6px_rgba(82,82,82,0.6)]",
    text: "text-neutral-400",
  },
};

export function PeerStatusIndicator({ stream, label, ...props }: Props) {
  const [status, setStatus] = useState<PeerStatus>("unknown");

  useEffect(() => {
    if (!stream) {
      setStatus("unknown");
      return;
    }

    const deriveStatus = (): PeerStatus => {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return "no-audio";
      const allEnded =
        !stream.active ||
        audioTracks.every((track) => track.readyState === "ended");
      if (allEnded) return "ended";

      const muted = audioTracks.every(
        (track) =>
          track.muted || track.enabled === false || track.readyState !== "live",
      );
      return muted ? "muted" : "live";
    };

    const update = () => setStatus(deriveStatus());
    update();

    const trackListeners = new Map<MediaStreamTrack, () => void>();
    const attachTrack = (track: MediaStreamTrack) => {
      if (trackListeners.has(track)) return;
      const onTrackEvent = () => update();
      track.addEventListener("ended", onTrackEvent);
      track.addEventListener("mute", onTrackEvent);
      track.addEventListener("unmute", onTrackEvent);
      trackListeners.set(track, onTrackEvent);
    };

    stream.getAudioTracks().forEach(attachTrack);

    const handleAddTrack = (event: MediaStreamTrackEvent) => {
      attachTrack(event.track);
      update();
    };
    const handleRemoveTrack = () => update();
    const handleInactive = () => update();

    stream.addEventListener("addtrack", handleAddTrack);
    stream.addEventListener("removetrack", handleRemoveTrack);
    stream.addEventListener("inactive", handleInactive);

    return () => {
      trackListeners.forEach((listener, track) => {
        track.removeEventListener("ended", listener);
        track.removeEventListener("mute", listener);
        track.removeEventListener("unmute", listener);
      });
      stream.removeEventListener("addtrack", handleAddTrack);
      stream.removeEventListener("removetrack", handleRemoveTrack);
      stream.removeEventListener("inactive", handleInactive);
    };
  }, [stream]);

  const meta = STATUS_META[status] ?? STATUS_META.unknown;

  return (
    <div
      {...props}
      className={classNames(
        "h-2.5 w-2.5 flex-none rounded-full border border-black/40",
        meta.dot,
        props.className,
      )}
      title={meta.label}
    />
  );
}
