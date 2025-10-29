import { useRef, type CSSProperties } from "react";
import { computed, type Signal, useSignalEffect } from "@preact/signals-react";

type Props = {
  levelSignal: Signal<number>;
  size?: number; // px
  label?: string;
  rgb?: [number, number, number]; // base color, default emerald
};

// Pure UI: bottom-heavy volume indicator relying solely on a gradient background.
export function VolumeIndicator({
  levelSignal,
  size = 48,
  label,
  rgb = [16, 185, 129],
}: Props) {
  const diameter = size;
  const circleRef = useRef<HTMLDivElement | null>(null);
  const fillPercent = computed(() => {
    const clamped = Math.max(0, Math.min(1, levelSignal.value));
    const eased = Math.pow(clamped, 0.5);
    return Math.min(100, Math.max(0, 6 + (100 - 6) * eased));
  });

  const colorRgb = rgb.join(",");

  useSignalEffect(() => {
    circleRef.current?.style.setProperty(
      "--fill-percent",
      `${fillPercent.value}%`,
    );
  });

  return (
    <div className="flex items-center gap-2">
      <div
        style={{ width: diameter, height: diameter }}
        className="relative flex items-center justify-center overflow-hidden rounded-full border border-neutral-700/70 bg-neutral-900 p-[6px] select-none"
        title={label}
        aria-label={label}
      >
        <div
          ref={circleRef}
          style={
            {
              "--ring-color": `rgba(${colorRgb}, 1)`,
              "--fill-color-rgb": colorRgb,
              "--fill-percent": "0%",
            } as CSSProperties
          }
          className={[
            "h-full w-full rounded-full",
            "bg-[linear-gradient(to_top,rgba(var(--fill-color-rgb),0.32)_0%,rgba(var(--fill-color-rgb),0.6)_var(--fill-percent),transparent_var(--fill-percent),transparent_100%)]",
            "shadow-[0_0_0_1.5px_var(--ring-color)]",
            "transition-[background] duration-150 ease-linear",
          ].join(" ")}
        />
      </div>
      {label && (
        <span className="max-w-[120px] truncate text-xs text-neutral-300">
          {label}
        </span>
      )}
    </div>
  );
}
