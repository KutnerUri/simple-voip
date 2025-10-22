import { useRef, useState, type FormEvent } from "react";
import { Button } from "./atoms/Button";

let ws: WebSocket;
let pc: RTCPeerConnection;

export function Voip() {
  const [activeStreams, setStreams] = useState<MediaStream[]>([]);

  const join = () => {
    ws = new WebSocket("ws://localhost:3000/ws");
    pc = new RTCPeerConnection();

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
        } catch {}
      }
    };

    // web RTC handlers:
    pc.onicecandidate = (e) => {
      if (e.candidate) ws.send(JSON.stringify({ candidate: e.candidate }));
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (!stream) return;

      setStreams((data) => [...data, stream]);
    };
  };

  return (
    <div className="mt-8 mx-auto w-full max-w-2xl text-left flex flex-col gap-4">
      <Button onClick={join}>connect</Button>

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
