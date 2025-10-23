import { useMemo, type CSSProperties } from "react";

type Props = {
  level: number; // 0..1
  size?: number; // px
  label?: string;
  rgb?: [number, number, number]; // base color, default emerald
};

// Pure UI: bottom-heavy volume indicator relying solely on a gradient background.
export function VolumeIndicator({
  level,
  size = 48,
  label,
  rgb = [16, 185, 129],
}: Props) {
  const clamped = Math.max(0, Math.min(1, level));

  const { fillPercent, colorRgb } = useMemo(() => {
    const eased = Math.pow(clamped, 0.5); // brighten lower levels a bit
    const fillPercent = Math.min(100, Math.max(0, 6 + (100 - 6) * eased));

    return { fillPercent, colorRgb: `${rgb[0]}, ${rgb[1]}, ${rgb[2]}` };
  }, [clamped, rgb]);

  const diameter = size;

  const variables = {
    "--ring-color": `rgba(${colorRgb}, 1)`,
    "--fill-color-rgb": colorRgb,
    "--fill-percent": `${fillPercent}%`,
  } as CSSProperties;

  return (
    <div className="flex items-center gap-2">
      <div
        style={{ width: diameter, height: diameter }}
        className="relative flex items-center justify-center overflow-hidden rounded-full border border-neutral-700/70 bg-neutral-900 p-[6px] select-none"
        title={label}
        aria-label={label}
      >
        <div
          style={variables}
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
