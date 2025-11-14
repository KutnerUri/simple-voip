import { MicrophoneIcon } from "../icons/MicrophoneIcon";
import { MicrophoneSlashIcon } from "../icons/MicrophoneSlashIcon";
import { EndCallIcon } from "../icons/EndCallIcon";

type Props = {
  local: MediaStream | null;
  inCall: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onDisconnect: () => void;
  onOpenSpeaker: () => void;
  canSelectSpeaker: boolean;
  speakerLabel: string;
};

const circleBase =
  "flex h-14 w-14 items-center justify-center rounded-full border transition-all duration-150 hover:-translate-y-0.5";

const COLORS = {
  mute: {
    live: "bg-[#404040] text-[#f3d2ac] border-[#acf3b1] hover:bg-[#505050]",
    muted: "bg-[#f4dfc3] text-[#1d130c] border-[#ff7a8f] hover:bg-[rgb(240, 212, 177)]",
    disabled: "bg-[#404040] text-[#5b5b5b] border-[#2b2b2b]",
  },
  hangup: {
    active: "bg-[#ff1f5a] text-white border-[#ff5d85] hover:bg-[#f50c48]",
    disabled: "bg-[#404040] text-[#5b5b5b] border-[#2b2b2b]",
  },
  speaker: {
    enabled:
      "bg-[#1a1a1a] text-white border-[#8bf1ff] hover:bg-[#252525]",
    disabled:
      "bg-[#404040] text-[#a7a7a7] border-[#343434] hover:translate-y-0 cursor-not-allowed",
  },
};

export function ConversationControls({
  local,
  inCall,
  isMuted,
  onToggleMute,
  onDisconnect,
  onOpenSpeaker,
  canSelectSpeaker,
  speakerLabel,
}: Props) {
  const muteDisabled = !local || !inCall;
  const speakerDisabled = !canSelectSpeaker;

  return (
    <div className="rounded-2xl border border-white/12 bg-[#121212]/80 p-4 shadow-xl backdrop-blur-sm">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onToggleMute}
          disabled={muteDisabled}
          className={[
            circleBase,
            muteDisabled
              ? `${COLORS.mute.disabled} cursor-not-allowed`
              : isMuted
                ? COLORS.mute.muted
                : COLORS.mute.live,
          ].join(" ")}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <MicrophoneSlashIcon className="h-8 w-8" />
          ) : (
            <MicrophoneIcon className="h-8 w-8" />
          )}
          <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
        </button>

        <button
          type="button"
          onClick={onDisconnect}
          disabled={!inCall}
          className={[
            circleBase,
            !inCall
              ? `${COLORS.hangup.disabled} cursor-not-allowed`
              : COLORS.hangup.active,
          ].join(" ")}
          title="End call"
        >
          <EndCallIcon className="h-6 w-6" />
          <span className="sr-only">End call</span>
        </button>

        <button
          type="button"
          onClick={onOpenSpeaker}
          disabled={speakerDisabled}
          className={[
            circleBase,
            speakerDisabled
              ? COLORS.speaker.disabled
              : COLORS.speaker.enabled,
          ].join(" ")}
          title={
            speakerDisabled
              ? "Speaker selection unavailable"
              : "Select speaker output"
          }
        >
          <span className="flex flex-col items-center leading-tight">
            <span className="text-[0.7rem] font-semibold tracking-wide">
              SPK
            </span>
            {/* {speakerLabel && (
              <span className="text-[0.6rem] font-medium text-white/80">
                {speakerLabel}
              </span>
            )} */}
          </span>
          <span className="sr-only">Speaker</span>
        </button>
      </div>
    </div>
  );
}
