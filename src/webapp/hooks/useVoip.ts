import { useCallback, useEffect, useRef, useState } from "react";
import { Voip as VoipClient } from "../core/Voip";

export type UseVoip = {
  streams: MediaStream[];
  error: string;
  ws: WebSocket | null;
  pc: RTCPeerConnection | null;
  wsState: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
};

export function useVoip(): UseVoip {
  const [streams, setStreams] = useState<MediaStream[]>([]);
  const [error, setError] = useState<string>("");
  const [wsState, setWsState] = useState<number | null>(null);

  const clientRef = useRef<VoipClient | null>(null);

  const disconnect = useCallback((status: number = WebSocket.CLOSED) => {
    setError("");
    clientRef.current?.disconnect();
  }, []);

  const connect = useCallback(async () => {
    setError("");

    const client = (clientRef.current = new VoipClient({
      onWsStateChange: setWsState,
      // onPeerStateChange: () => {},
      onError: (m, e) =>
        setError(m + (e instanceof Error ? `: ${e.message}` : "")),
      onStreamChange: setStreams,
    }));
    try {
      await client.connect();
      await client.startCall();
    } catch (err) {
      setError(
        "Failed to start call" +
          (err instanceof Error ? `: ${err.message}` : "")
      );
    }
  }, []);

  useEffect(() => () => disconnect(), [disconnect]);

  return {
    streams,
    error,
    ws: clientRef.current?.socket ?? null,
    pc: clientRef.current?.peer ?? null,
    wsState,
    connect,
    disconnect,
  };
}
