import { useEffect } from "react";
import { useSignal, type Signal } from "@preact/signals-react";

/**
 * Produces a reactive audio level (0..1) for a given MediaStream.
 */
export function useAudioLevel(stream: MediaStream | null): Signal<number> {
  const level = useSignal(0);

  useEffect(() => {
    level.value = 0;

    const rafRef = { current: undefined as number | undefined };
    const audioCtxRef = { current: undefined as AudioContext | undefined };
    const analyserRef = { current: undefined as AnalyserNode | undefined };
    const sourceRef = {
      current: undefined as MediaStreamAudioSourceNode | undefined,
    };

    const Ctx = window.AudioContext;
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
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i]! - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      const val = Math.max(0, Math.min(1, rms * 2));
      level.value = level.value * 0.6 + val * 0.4;
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

  return level;
}
