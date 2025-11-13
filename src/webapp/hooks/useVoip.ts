import { useCallback, useEffect, useRef, useState } from "react";
import { Voip as VoipClient } from "../core/Voip";
import type { VoipPeer } from "../core/Voip";

export type UseVoip = {
  peers: VoipPeer[];
  error: string;
  ws: WebSocket | null;
  wsState: number | null;
  local: MediaStream | null;
  isMuted: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  toggleMute: () => void;
  openSpeakerSelector: () => void;
};

export function useVoip(): UseVoip {
  const [peers, setPeers] = useState<VoipPeer[]>([]);
  const [error, setError] = useState<string>("");
  const [wsState, setWsState] = useState<number | null>(null);
  const [local, setLocal] = useState<MediaStream | null>(null);
  const [muted, setMuted] = useState(false);

  const clientRef = useRef<VoipClient | null>(null);

  const disconnect = useCallback((status: number = WebSocket.CLOSED) => {
    setError("");
    setPeers([]);
    setLocal(null);
    setWsState(status);
    setMuted(false);
    clientRef.current?.disconnect();
  }, []);

  const connect = useCallback(async () => {
    setError("");

    const client = new VoipClient({
      onWsStateChange: setWsState,
      onError: (m, e) =>
        setError(m + (e instanceof Error ? `: ${e.message}` : "")),
      onPeersChange: setPeers,
    });
    clientRef.current = client;

    try {
      await client.connect();
      const ls = await client.startCall();
      setLocal(ls);
      setMuted(false);
    } catch (err) {
      setError(
        "Failed to start call" +
          (err instanceof Error ? `: ${err.message}` : ""),
      );
    }
  }, []);

  useEffect(() => {
    if (!local) return;
    const enabled = !muted;
    local.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }, [local, muted]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => !prev);
  }, []);

  const openSpeakerSelector = useCallback(() => {
    console.warn("TODO: implement speaker output selection");
  }, []);

  useEffect(() => () => disconnect(), [disconnect]);

  return {
    peers,
    error,
    ws: clientRef.current?.socket ?? null,
    wsState,
    local,
    isMuted: muted,
    connect,
    disconnect,
    toggleMute,
    openSpeakerSelector,
  };
}
