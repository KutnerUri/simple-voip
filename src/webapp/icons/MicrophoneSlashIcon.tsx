import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

export function MicrophoneSlashIcon({
  title,
  width = 24,
  height = 24,
  color = "currentColor",
  ...rest
}: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden={title ? undefined : true}
      color={color}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M14 10V7a2 2 0 10-4 0v5c0 .552.224 1.052.586 1.414M14 10l5-5m-5 5l-3.414 3.414M8 10v2c0 1.105.448 2.105 1.172 2.828M16 10v2a4 4 0 01-4 4m0 0v3m0-3c-.498 0-.975-.091-1.414-.257m0-2.329l-1.414 1.414m0 0L5 19m9-7a2 2 0 01-2 2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
