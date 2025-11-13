import { useMemo } from "react";
import type { VoipPeer } from "../core/Voip";
import { VolumeIndicator } from "./VolumeIndicator";
import { PeerStatusIndicator } from "./PeerStatusIndicator";
import { useAudioLevel } from "../hooks/useAudioLevel";

type Props = {
  peer: VoipPeer;
  size?: number; // px
  label?: string;
};

// Simple audio-level driven avatar glow for a peer stream
export function PeerIndicator({ peer, size = 48, label }: Props) {
  const { stream } = peer;

  const level = useAudioLevel(stream);

  const rgb = useMemo<[number, number, number]>(() => {
    if (peer.id === "local") return [59, 130, 246];
    return idToColor(peer.id);
  }, [peer.id]);

  return (
    <div className="">
      <div className="relative">
        <VolumeIndicator levelSignal={level} size={size} rgb={rgb} />
        <PeerStatusIndicator
          stream={stream}
          className="absolute right-[5%] bottom-[5%]"
        />
      </div>
      <div className="text-center">{label}</div>
    </div>
  );
}

function idToColor(id: string): [number, number, number] {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) + hash + id.charCodeAt(i);
  }
  const h = (hash >>> 0) % 360;
  const s = 70;
  const l = 42;
  const k = (n: number) => (n + h / 30) % 12;
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) =>
    l / 100 - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  return [
    Math.round(255 * f(0)),
    Math.round(255 * f(8)),
    Math.round(255 * f(4)),
  ];
}
