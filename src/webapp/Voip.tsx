import { useMemo } from "react";
import { Button } from "./atoms/Button";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { useVoip } from "./hooks/useVoip";
import type { VoipPeer } from "./core/Voip";
import { PeerIndicator } from "./components/PeerIndicator";
import { ConversationControls } from "./components/ConversationControls";
import { useAudioOutputs } from "./hooks/useAudioOutputs";
import { AudioOutput } from "./components/AudioOutput";
import { useOutputDeviceSelector } from "./hooks/useOutputDeviceSelector";

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
  } = useVoip();

  const {
    audioOutputs,
    isEnumerating: isListingOutputs,
    supportsOutputSelection,
  } = useAudioOutputs();

  const { selectedOutputDevice, selectedSinkId, toggleAudio } =
    useOutputDeviceSelector(audioOutputs);

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
          <AudioOutput
            key={stream.id}
            stream={stream}
            output={supportsOutputSelection ? selectedOutputDevice : undefined}
          />
        ))}
      </>

      <ConversationControls
        local={local}
        inCall={inCall}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onDisconnect={disconnect}
        onOpenSpeaker={toggleAudio}
        canSelectSpeaker={supportsOutputSelection && audioOutputs.length > 0}
        speakerLabel={selectedOutputDevice?.label || ""}
      />

      <div className="rounded-lg border border-slate-500/30 bg-slate-900/20 p-3 text-xs text-slate-200">
        <div className="mb-1 font-semibold tracking-wide text-slate-400 uppercase">
          Output devices
        </div>
        {isListingOutputs && (
          <div className="text-slate-400">Scanning for devices…</div>
        )}
        {!isListingOutputs && audioOutputs.length === 0 && (
          <div className="text-slate-400">
            {supportsOutputSelection
              ? "No audio outputs are currently available."
              : "This browser does not expose audio output selection."}
          </div>
        )}
        {!isListingOutputs && audioOutputs.length > 0 && (
          <ul className="list-disc pl-5">
            {audioOutputs.map((device) => (
              <li
                key={device.deviceId}
                className={
                  device.deviceId === selectedSinkId
                    ? "font-semibold text-white"
                    : undefined
                }
              >
                {device.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConnectionStatus ws={ws} />

      {error && (
        <div className="rounded-lg border border-rose-600/40 bg-rose-900/20 p-3 text-sm text-rose-200 text-rose-400">
          <div className="leading-5">{error}</div>
        </div>
      )}
    </div>
  );
}
