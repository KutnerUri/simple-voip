import { useMemo } from "react";

type Props = {
  level: number; // 0..1
  size?: number; // px
  label?: string;
  rgb?: [number, number, number]; // base color, default emerald
};

// Pure UI: bottom-heavy volume indicator. No audio analysis.
export function VolumeIndicator({ level, size = 48, label, rgb = [16, 185, 129] }: Props) {
  const visual = Math.max(0, Math.min(1, level));

  const { fillHeight, isFull, ringColor, fillColor } = useMemo(() => {
    const eased = Math.pow(visual, 0.5);
    const minFill = 6; // percent baseline
    let fh = minFill + (100 - minFill) * eased;
    fh = Math.min(100, Math.max(0, fh));
    const ring = `rgba(${rgb[0]},${rgb[1]},${rgb[2]}, 0.6)`;
    const fill = `rgba(${rgb[0]},${rgb[1]},${rgb[2]}, 0.35)`;
    const full = fh >= 99.5 || visual >= 0.999;
    return { fillHeight: Math.round(fh), isFull: full, ringColor: ring, fillColor: fill };
  }, [visual, rgb]);

  const diameter = size;

  return (
    <div className="flex items-center gap-2">
      <div
        style={{ width: diameter, height: diameter }}
        className="relative rounded-full bg-neutral-900 border border-neutral-700/70 flex items-center justify-center select-none overflow-hidden"
        title={label}
        aria-label={label}
      >
        <div
          className="relative rounded-full overflow-hidden"
          style={{
            width: diameter - 12,
            height: diameter - 12,
            boxShadow: `0 0 0 1.5px ${ringColor}`,
            background: "#0a0a0a",
          }}
        >
          {/* this could be optimized / smoothed out */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: `${fillHeight}%`,
              background: fillColor,
              borderTop: isFull ? "none" : `1px solid ${ringColor}`,
            }}
          />
        </div>
      </div>
      {label && (
        <span className="text-xs text-neutral-300 truncate max-w-[120px]">{label}</span>
      )}
    </div>
  );
}

