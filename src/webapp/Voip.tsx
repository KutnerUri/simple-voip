import { Button } from "./atoms/Button";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { useVoip } from "./hooks/useVoip";
import type { VoipPeer } from "./core/Voip";
import { PeerIndicator } from "./components/PeerIndicator";

export function Voip() {
  const { peers, error, ws, wsState, local, connect, disconnect } = useVoip();

  return (
    <div className="mt-8 mx-auto w-full max-w-2xl text-left flex flex-col gap-4">
      <div className="flex gap-2 w-full">
        {wsState === WebSocket.OPEN ? (
          <Button onClick={disconnect} className="w-full">
            disconnect
          </Button>
        ) : (
          <Button
            onClick={connect}
            className="w-full"
            disabled={wsState === WebSocket.CONNECTING}
          >
            {wsState === WebSocket.CONNECTING ? "connecting…" : "connect"}
          </Button>
        )}
      </div>

      {(local || peers.length > 0) && (
        <div className="flex flex-wrap items-center gap-3">
          {local && (
            <PeerIndicator peer={{ id: "local", stream: local }} label="You" />
          )}
          {peers.map((p: VoipPeer) => (
            <PeerIndicator key={p.id} peer={p} />
          ))}
        </div>
      )}

      <>
        {peers.map(({ stream }) => (
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

      <ConnectionStatus ws={ws} />

      {error && (
        <div className="rounded-lg border text-rose-400 border-rose-600/40 bg-rose-900/20 text-rose-200 text-sm p-3">
          <div className="leading-5">{error}</div>
        </div>
      )}
    </div>
  );
}
