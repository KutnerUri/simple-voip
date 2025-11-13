import { useEffect, useRef, useState } from "react";

type Props = {
  ws: WebSocket | null;
  maxItems?: number;
};

export function ConnectionStatus({ ws, maxItems = 100 }: Props) {
  const [wsStatus, setWsStatus] = useState<string>(
    ws ? ws.readyState.toString() : "disconnected",
  );
  const [feed, setFeed] = useState<string[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);

  const push = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setFeed((prev) => {
      const next = [...prev, `[${time}] ${msg}`];
      if (next.length > maxItems) next.splice(0, next.length - maxItems);
      return next;
    });
  };

  // Map WebSocket readyState to human readable
  const wsReadyState = (ready?: number): string => {
    switch (ready) {
      case WebSocket.CONNECTING:
        return "connecting";
      case WebSocket.OPEN:
        return "open";
      case WebSocket.CLOSING:
        return "closing";
      case WebSocket.CLOSED:
        return "closed";
      default:
        return "disconnected";
    }
  };

  const wsColor = (status: string) => {
    if (status === "open") return "text-emerald-400";
    if (status === "connecting" || status === "closing") return "text-amber-300";
    if (status === "error" || status === "closed" || status === "disconnected") return "text-rose-400";
    return "text-neutral-300";
  };

  useEffect(() => {
    setWsStatus(ws ? wsReadyState(ws.readyState) : "disconnected");
    if (!ws) return;

    const handleOpen = () => {
      setWsStatus("open");
      push("WS: open");
    };
    const handleClose = () => {
      setWsStatus("closed");
      push("WS: closed");
    };
    const handleError = () => {
      setWsStatus("error");
      push("WS: error");
    };

    ws.addEventListener("open", handleOpen);
    ws.addEventListener("close", handleClose);
    ws.addEventListener("error", handleError);

    return () => {
      ws.removeEventListener("open", handleOpen);
      ws.removeEventListener("close", handleClose);
      ws.removeEventListener("error", handleError);
    };
  }, [ws]);

  // Auto-scroll the feed when new items arrive
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [feed]);

  return (
    <div className="rounded-lg border border-[#3a3a3a] p-3 text-sm bg-black/20 backdrop-blur-sm shadow-inner flex flex-col gap-2">
      <div className="text-neutral-200">
        <span className="font-semibold text-neutral-300">WebSocket:</span>
        <span className={`ml-1 font-medium ${wsColor(wsStatus)}`}>{wsStatus}</span>
      </div>
      <div className="mt-1 max-h-40 overflow-auto rounded-md border border-[#3a3a3a] bg-neutral-800/40" ref={listRef}>
        {feed.length === 0 ? (
          <div className="px-2 py-1 text-neutral-400">No events yet</div>
        ) : (
          feed.map((line, i) => (
            <div key={i} className="px-2 py-1 font-mono text-[11px] leading-[1.1rem] text-neutral-300 whitespace-pre-wrap">
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
