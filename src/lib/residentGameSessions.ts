import { randomBytes } from "node:crypto";

export type ResidentGameAction = "next-card" | "choose-card" | "exit";
export type ResidentGameRole = "display" | "controller";

export interface ResidentControllerEvent {
  sessionId: string;
  actionId: ResidentGameAction;
  sequence: number;
  occurredAt: string;
}

export interface ResidentGameSessionSnapshot {
  sessionId: string;
  pairingCode: string;
  gameId: "flower-memory";
  connectionState: "waiting" | "connected" | "reconnecting" | "ended" | "expired";
  lastSequence: number;
  events: ResidentControllerEvent[];
  expiresAt: string;
}

type StoredSession = ResidentGameSessionSnapshot & {
  displaySeenAt: number;
  controllerSeenAt?: number;
};

const SESSION_TTL_MS = 15 * 60_000;
const RECONNECT_AFTER_MS = 6_000;

export class ResidentGameSessionStore {
  private sessions = new Map<string, StoredSession>();

  constructor(private now: () => number = Date.now) {}

  create(): ResidentGameSessionSnapshot {
    const sessionId = randomBytes(12).toString("base64url");
    const pairingCode = String(Number.parseInt(randomBytes(3).toString("hex"), 16) % 1_000_000).padStart(6, "0");
    const createdAt = this.now();
    const session: StoredSession = {
      sessionId,
      pairingCode,
      gameId: "flower-memory",
      connectionState: "waiting",
      lastSequence: 0,
      events: [],
      displaySeenAt: createdAt,
      expiresAt: new Date(createdAt + SESSION_TTL_MS).toISOString(),
    };
    this.sessions.set(sessionId, session);
    return this.snapshot(session);
  }

  get(sessionId: string, afterSequence = 0, role?: ResidentGameRole): ResidentGameSessionSnapshot | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    this.refreshState(session);
    if (role === "display") session.displaySeenAt = this.now();
    if (role === "controller") session.controllerSeenAt = this.now();
    return { ...this.snapshot(session), events: session.events.filter(event => event.sequence > afterSequence) };
  }

  join(sessionId: string, pairingCode: string): ResidentGameSessionSnapshot | undefined {
    const session = this.sessions.get(sessionId);
    if (!session || session.pairingCode !== pairingCode) return undefined;
    this.refreshState(session);
    if (session.connectionState === "expired" || session.connectionState === "ended") return this.snapshot(session);
    session.controllerSeenAt = this.now();
    session.connectionState = "connected";
    return this.snapshot(session);
  }

  heartbeat(sessionId: string, role: ResidentGameRole): ResidentGameSessionSnapshot | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    this.refreshState(session);
    if (role === "display") session.displaySeenAt = this.now();
    if (role === "controller" && session.controllerSeenAt) {
      session.controllerSeenAt = this.now();
      if (session.connectionState === "reconnecting") session.connectionState = "connected";
    }
    return this.snapshot(session);
  }

  addEvent(sessionId: string, event: ResidentControllerEvent): { snapshot: ResidentGameSessionSnapshot; duplicate: boolean } | undefined {
    const session = this.sessions.get(sessionId);
    if (!session || event.sessionId !== sessionId) return undefined;
    this.refreshState(session);
    if (session.connectionState === "expired" || session.connectionState === "ended") return { snapshot: this.snapshot(session), duplicate: true };
    if (!session.controllerSeenAt) throw new Error("Controller has not completed pairing");
    session.controllerSeenAt = this.now();
    session.connectionState = "connected";
    if (event.sequence <= session.lastSequence) return { snapshot: this.snapshot(session), duplicate: true };
    if (event.sequence !== session.lastSequence + 1) throw new Error(`Expected sequence ${session.lastSequence + 1}`);
    session.events.push(event);
    session.lastSequence = event.sequence;
    if (event.actionId === "exit") session.connectionState = "ended";
    return { snapshot: this.snapshot(session), duplicate: false };
  }

  end(sessionId: string): ResidentGameSessionSnapshot | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    session.connectionState = "ended";
    return this.snapshot(session);
  }

  private refreshState(session: StoredSession) {
    const now = this.now();
    if (now >= Date.parse(session.expiresAt)) session.connectionState = "expired";
    else if (session.connectionState !== "waiting" && session.connectionState !== "ended" && session.controllerSeenAt && now - session.controllerSeenAt > RECONNECT_AFTER_MS) session.connectionState = "reconnecting";
  }

  private snapshot(session: StoredSession): ResidentGameSessionSnapshot {
    const { displaySeenAt: _displaySeenAt, controllerSeenAt: _controllerSeenAt, ...snapshot } = session;
    return { ...snapshot, events: [...snapshot.events] };
  }
}
