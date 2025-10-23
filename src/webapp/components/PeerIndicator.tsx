import { useEffect, useMemo, useRef, useState } from "react";
import type { VoipPeer } from "../core/Voip";
import { VolumeIndicator } from "./VolumeIndicator";

type Props = {
  peer: VoipPeer;
  size?: number; // px
  label?: string;
};

// Simple audio-level driven avatar glow for a peer stream
export function PeerIndicator({ peer, size = 48, label }: Props) {
  const stream = peer.stream;
  const [level, setLevel] = useState(0); // measured 0..1

  useEffect(() => {
    const rafRef = { current: undefined as number | undefined };
    const audioCtxRef = { current: undefined as AudioContext | undefined };
    const analyserRef = { current: undefined as AnalyserNode | undefined };
    const sourceRef = {
      current: undefined as MediaStreamAudioSourceNode | undefined,
    };

    const Ctx = window.AudioContext; // || (window as any).webkitAudioContext; // ? STOP UNCOMMENTING THIS
    if (!stream || !Ctx) return;

    const ctx: AudioContext = new Ctx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.7;
    const source = ctx.createMediaStreamSource(stream);
    try {
      source.connect(analyser);
    } catch {}

    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    sourceRef.current = source;

    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteTimeDomainData(data);
      // Compute a simple normalized RMS from waveform
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i]! - 128) / 128; // -1..1
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length); // 0..1
      // Map to a friendlier curve and clamp
      const val = Math.max(0, Math.min(1, rms * 2));
      setLevel((prev) => prev * 0.6 + val * 0.4); // smooth
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const onVisibility = () => {
      if (document.hidden) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = undefined;
      } else if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try {
        sourceRef.current?.disconnect();
        analyser.disconnect();
      } catch {}
      try {
        ctx.close();
      } catch {}
      audioCtxRef.current = undefined;
      analyserRef.current = undefined;
      sourceRef.current = undefined;
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [stream]);

  return <VolumeIndicator level={level} size={size} label={label} />;
}
