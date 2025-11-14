import { Button } from "./atoms/Button";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { useVoip } from "./hooks/useVoip";
import type { VoipPeer } from "./core/Voip";
import { PeerIndicator } from "./components/PeerIndicator";
import { ConversationControls } from "./components/ConversationControls";

export function Voip() {
  const {
    peers,
    error,
    ws,
    wsState,
    local,
    connect,
    disconnect,
    isMuted,
    toggleMute,
    openSpeakerSelector,
  } = useVoip();

  const inCall = wsState === WebSocket.OPEN;

  return (
    <div className="mx-auto mt-8 flex w-full max-w-2xl flex-col gap-4 text-left">
      <div className="flex w-full gap-2">
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
        <div className="flex flex-wrap items-start gap-3">
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

      <ConversationControls
        local={local}
        inCall={inCall}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onDisconnect={disconnect}
        onOpenSpeaker={openSpeakerSelector}
      />

      <ConnectionStatus ws={ws} />

      {error && (
        <div className="rounded-lg border border-rose-600/40 bg-rose-900/20 p-3 text-sm text-rose-200 text-rose-400">
          <div className="leading-5">{error}</div>
        </div>
      )}
    </div>
  );
}
