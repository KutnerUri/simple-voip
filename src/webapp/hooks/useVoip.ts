import { useCallback, useEffect, useRef, useState } from "react";
import { Voip as VoipClient } from "../core/Voip";
import type { VoipPeer } from "../core/Voip";

export type UseVoip = {
  peers: VoipPeer[];
  error: string;
  ws: WebSocket | null;
  pc: RTCPeerConnection | null;
  wsState: number | null;
  local: MediaStream | null;
  connect: () => Promise<void>;
  disconnect: () => void;
};

export function useVoip(): UseVoip {
  const [peers, setPeers] = useState<VoipPeer[]>([]);
  const [error, setError] = useState<string>("");
  const [wsState, setWsState] = useState<number | null>(null);
  const [local, setLocal] = useState<MediaStream | null>(null);

  const clientRef = useRef<VoipClient | null>(null);

  const disconnect = useCallback((status: number = WebSocket.CLOSED) => {
    setError("");
    setPeers([]);
    setLocal(null);
    setWsState(status);
    clientRef.current?.disconnect();
  }, []);

  const connect = useCallback(async () => {
    setError("");

    const client = (clientRef.current = new VoipClient({
      onWsStateChange: setWsState,
      // onPeerStateChange: () => {},
      onError: (m, e) =>
        setError(m + (e instanceof Error ? `: ${e.message}` : "")),
      onPeersChange: setPeers,
    }));
    try {
      await client.connect();
      const ls = await client.startCall();
      setLocal(ls);
    } catch (err) {
      setError(
        "Failed to start call" +
          (err instanceof Error ? `: ${err.message}` : "")
      );
    }
  }, []);

  useEffect(() => () => disconnect(), [disconnect]);

  return {
    peers,
    error,
    ws: clientRef.current?.socket ?? null,
    pc: clientRef.current?.peer ?? null,
    wsState,
    local,
    connect,
    disconnect,
  };
}
