import type { ButtonHTMLAttributes } from "react";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={[
        "bg-[#fbf0df] text-[#1a1a1a] border-0 px-5 py-1.5 rounded-lg font-bold transition-all duration-100 cursor-pointer whitespace-nowrap",
        "hover:bg-[#f3d5a3] hover:-translate-y-px",
        "active:translate-y-px",
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
