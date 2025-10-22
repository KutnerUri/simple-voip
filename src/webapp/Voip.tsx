import { useEffect, useRef, useState } from "react";
import { Button } from "./atoms/Button";
import { ConnectionStatus } from "./components/ConnectionStatus";

export function Voip() {
  const [activeStreams, setStreams] = useState<MediaStream[]>([]);
  const [error, setError] = useState<string>("");
  const [wsState, setWsState] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const reportError = (msg: string, err?: unknown) => {
    const detail = err instanceof Error ? `: ${err.message}` : "";
    setError(`${msg}${detail}`);
  };

  const join = async () => {
    setError("");
    const wsScheme = location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${wsScheme}://${location.host}/ws`;
    const ws = (wsRef.current = new WebSocket(wsUrl));
    const pc = (pcRef.current = new RTCPeerConnection());

    // reflect WS state for button rendering
    setWsState(WebSocket.CONNECTING);
    ws.addEventListener("open", () => setWsState(WebSocket.OPEN));
    ws.addEventListener("close", () => setWsState(WebSocket.CLOSED));
    ws.addEventListener("error", () => setWsState(WebSocket.CLOSED));

    // ws handlers
    ws.onmessage = async (e) => {
      const data = JSON.parse(e.data);
      if (typeof data !== "object") return;

      if (data.sdp) {
        await pc.setRemoteDescription(data.sdp);
        if (data.sdp.type === "offer") {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          ws.send(JSON.stringify({ sdp: pc.localDescription }));
        }
        return;
      }

      if (data.candidate) {
        try {
          await pc.addIceCandidate(data.candidate);
          return;
        } catch (err) {
          reportError("Failed to add ICE candidate", err);
        }
      }
    };

    // WebRTC handlers:
    pc.onicecandidate = (e) => {
      if (e.candidate) ws.send(JSON.stringify({ candidate: e.candidate }));
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (!stream) return;

      setStreams((data) => [...data, stream]);
    };

    // Start call: capture mic, add tracks, create + send offer
    try {
      if (!("mediaDevices" in navigator) || !navigator.mediaDevices?.getUserMedia) {
        reportError(
          "getUserMedia is not available. Use a modern browser and load over HTTPS or localhost."
        );
        return;
      }
      if (!window.isSecureContext && location.hostname !== "localhost") {
        reportError("Microphone access requires a secure context (HTTPS)");
        return;
      }

      const local = await navigator.mediaDevices.getUserMedia({ audio: true });
      local.getTracks().forEach((track) => pc.addTrack(track, local));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sendLocal = () => {
        if (pc.localDescription) {
          ws.send(JSON.stringify({ sdp: pc.localDescription }));
        }
      };

      if (ws.readyState === WebSocket.OPEN) {
        sendLocal();
      } else {
        ws.addEventListener("open", sendLocal, { once: true });
      }
    } catch (err) {
      reportError("Failed to start call", err);
    }
  };

  const disconnect = () => {
    try {
      wsRef.current?.close();
    } catch {}
    try {
      pcRef.current?.getSenders().forEach((s) => s.track && s.track.stop());
      pcRef.current?.close();
    } catch {}
    wsRef.current = null;
    pcRef.current = null;
    setStreams([]);
    setError("");
    setWsState(WebSocket.CLOSED);
  };

  useEffect(() => {
    return () => {
      try {
        wsRef.current?.close();
      } catch {}
      try {
        pcRef.current?.getSenders().forEach((s) => s.track && s.track.stop());
        pcRef.current?.close();
      } catch {}
    };
  }, []);

  return (
    <div className="mt-8 mx-auto w-full max-w-2xl text-left flex flex-col gap-4">
      <div className="flex gap-2 w-full">
        {wsState === WebSocket.OPEN ? (
          <Button onClick={disconnect} className="w-full">
            disconnect
          </Button>
        ) : (
          <Button
            onClick={join}
            className="w-full"
            disabled={wsState === WebSocket.CONNECTING}
          >
            {wsState === WebSocket.CONNECTING
              ? "connecting…"
              : "connect"}
          </Button>
        )}
      </div>

      <ConnectionStatus ws={wsRef.current} pc={pcRef.current} />

      {error && (
        <div className="rounded-lg border text-rose-400 border-rose-600/40 bg-rose-900/20 text-rose-200 text-sm p-3">
          <div className="leading-5">{error}</div>
        </div>
      )}

      <>
        {activeStreams.map((stream) => (
          <audio
            key={stream.id}
            autoPlay
            ref={(el) => {
              if (el && el.srcObject !== stream) {
                el.srcObject = stream;
              }
            }}
          />
        ))}
      </>
    </div>
  );
}
