export type VoipCallbacks = {
  onWsStateChange?: (state: number) => void;
  onPeerStateChange?: (state: {
    connection: RTCPeerConnectionState;
    signaling: RTCSignalingState;
    ice: RTCIceConnectionState;
  }) => void;
  onError?: (message: string, err?: unknown) => void;
  onStreamChange?: (streams: MediaStream[]) => void;
};

export type VoipOptions = VoipCallbacks & {
  wsUrl?: string;
  rtcConfig?: RTCConfiguration;
};

export class Voip {
  private ws: WebSocket | undefined = undefined;
  private pc: RTCPeerConnection | undefined = undefined;
  private streams: MediaStream[] = [];
  private teardowns: Array<() => void> = [];
  private localStream: MediaStream | undefined = undefined;

  constructor(private opts: VoipOptions = {}) {}

  get peer(): RTCPeerConnection | undefined {
    return this.pc;
  }
  get socket(): WebSocket | undefined {
    return this.ws;
  }
  get currentStreams(): MediaStream[] {
    return this.streams;
  }

  disconnect(): void {
    this.cleanupListeners();
    this.safeCloseWs();
    this.stopAndClose();
  }

  async connect(): Promise<void> {
    if (this.ws || this.pc) this.disconnect();

    const wsUrl = this.opts.wsUrl ?? buildWsUrl("/ws");
    this.ws = new WebSocket(wsUrl);
    this.pc = new RTCPeerConnection(this.opts.rtcConfig);

    this.syncWsState();
    this.handleMessages();
    this.handleIce();
    this.syncPeerState();
    this.handleNewStream();
  }

  async startCall(): Promise<MediaStream> {
    const { ws, pc } = this;

    // TODO error needs to be better
    if (!ws || !pc) throw new Error("Not connected");

    const local = await this.startLocalAudio(pc);
    const offer = await pc.createOffer({});
    await pc.setLocalDescription(offer);
    void this.sendLocalDescription(ws, pc);
    return local;
  }

  // handshake

  private async startLocalAudio(pc: RTCPeerConnection): Promise<MediaStream> {
    assertVoipCapable();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    this.localStream = stream;
    return stream;
  }

  private async sendLocalDescription(ws: WebSocket, pc: RTCPeerConnection) {
    await new Promise<void>((resolve) => {
      if (ws.readyState === WebSocket.OPEN) resolve();
      else ws.addEventListener("open", () => resolve(), { once: true });
    });

    if (pc.localDescription)
      ws.send(JSON.stringify({ sdp: pc.localDescription }));
  }

  // handle messages/state

  private syncWsState() {
    const { ws, opts } = this;
    if (!ws) throw new Error("handleStateChange called without ws");

    // emit initial ws state
    opts.onWsStateChange?.(ws.readyState);
    const onOpen = () => opts.onWsStateChange?.(WebSocket.OPEN);
    const onClose = () => opts.onWsStateChange?.(WebSocket.CLOSED);
    const onError = () => opts.onWsStateChange?.(WebSocket.CLOSED);
    ws.addEventListener("open", onOpen);
    ws.addEventListener("close", onClose);
    ws.addEventListener("error", onError);

    this.teardowns.push(() => {
      ws.removeEventListener("open", onOpen);
      ws.removeEventListener("close", onClose);
      ws.removeEventListener("error", onError);
    });
  }

  private syncPeerState() {
    const { pc, teardowns } = this;
    if (!pc) throw "this shoudl not happen";

    const peerUpdate = () =>
      this.opts.onPeerStateChange?.({
        connection: pc.connectionState,
        signaling: pc.signalingState,
        ice: pc.iceConnectionState,
      });

    pc.addEventListener("connectionstatechange", peerUpdate);
    pc.addEventListener("signalingstatechange", peerUpdate);
    pc.addEventListener("iceconnectionstatechange", peerUpdate);
    teardowns.push(() => {
      pc.removeEventListener("connectionstatechange", peerUpdate);
      pc.removeEventListener("signalingstatechange", peerUpdate);
      pc.removeEventListener("iceconnectionstatechange", peerUpdate);
    });
  }

  private handleNewStream() {
    const { pc } = this;
    if (!pc) return;

    // Track handling
    pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (!stream) return;
      // avoid duplicates on renegotiation
      if (this.streams.some((s) => s.id === stream.id)) return;
      this.streams = [...this.streams, stream];
      this.opts.onStreamChange?.(this.streams);
    };
  }

  private handleMessages() {
    const { ws, pc, opts } = this;
    if (!ws || !pc) return;

    const onMessage = async (e: MessageEvent) => {
      try {
        const data = JSON.parse((e as MessageEvent<any>).data);
        if (typeof data !== "object" || data === null) return;
        if (this.pc?.signalingState === "closed") return;

        if ("sdp" in data) {
          const sdp: RTCSessionDescriptionInit = (data as any).sdp;
          await pc.setRemoteDescription(sdp);
          if (sdp.type === "offer") {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify({ sdp: pc.localDescription }));
          }
          return;
        }

        if ("candidate" in data) {
          // only add ICE when peer is in a valid state and has remote description
          if (pc.signalingState !== "closed" && pc.remoteDescription) {
            await pc.addIceCandidate((data as any).candidate);
          }
          return;
        }
      } catch (err) {
        opts.onError?.("Signaling error", err);
      }
    };

    ws.addEventListener("message", onMessage as any);
    return () => {
      ws.removeEventListener("message", onMessage as any);
    };
  }

  private handleIce() {
    const { ws, pc, opts } = this;
    if (!ws || !pc) return;

    const onIce = (e: RTCPeerConnectionIceEvent) => {
      if (e.candidate) ws.send(JSON.stringify({ candidate: e.candidate }));
    };

    pc.addEventListener("icecandidate", onIce);
    this.teardowns.push(() => {
      pc.removeEventListener("icecandidate", onIce);
    });
  }

  // destructor

  private cleanupListeners() {
    try {
      this.teardowns.forEach((fn) => fn());
    } catch {}
    this.teardowns = [];
  }

  private stopAndClose() {
    const { pc } = this;
    if (!pc) return;

    try {
      pc.getSenders().forEach((s) => s.track && s.track.stop());
    } catch {}
    try {
      // some browsers expose stop()
      pc.getTransceivers?.().forEach((t) => t.stop());
    } catch {}
    try {
      pc.close();
    } catch {}
    // Clear remote streams and notify; no need to stop remote tracks we didn't start
    this.streams = [];
    this.opts.onStreamChange?.([]);
    // Stop local preview stream if tracked
    try {
      this.localStream?.getTracks().forEach((t) => t.stop());
    } catch {}
    this.localStream = undefined;
  }

  private safeCloseWs() {
    const { ws } = this;
    if (!ws) return;

    this.opts.onWsStateChange?.(WebSocket.CLOSING);
    try {
      ws.close();
    } catch {}

    this.ws = undefined;
    this.opts.onWsStateChange?.(WebSocket.CLOSED);
  }
}

function assertVoipCapable() {
  const media = (navigator as any).mediaDevices;
  if (!media || typeof media.getUserMedia !== "function") {
    throw new Error("getUserMedia is not available. Use a modern browser.");
  }
  if (!window.isSecureContext && location.hostname !== "localhost") {
    throw new Error("Microphone access requires HTTPS (or localhost).");
  }
}

export function buildWsUrl(path = "/ws"): string {
  const scheme = location.protocol === "https:" ? "wss" : "ws";
  return `${scheme}://${location.host}${path}`;
}
