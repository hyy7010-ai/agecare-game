import { describe, expect, it } from "vitest";
import { ResidentGameSessionStore } from "./residentGameSessions";

describe("resident game sessions", () => {
  it("does not report connected until the controller completes the handshake", () => {
    const store = new ResidentGameSessionStore(() => 1_000);
    const created = store.create();
    expect(created.connectionState).toBe("waiting");
    expect(store.join(created.sessionId, "wrong")).toBeUndefined();
    expect(store.join(created.sessionId, created.pairingCode)?.connectionState).toBe("connected");
  });

  it("accepts ordered events and acknowledges duplicate delivery once", () => {
    const store = new ResidentGameSessionStore(() => 1_000);
    const session = store.create();
    store.join(session.sessionId, session.pairingCode);
    const event = { sessionId: session.sessionId, actionId: "next-card" as const, sequence: 1, occurredAt: new Date().toISOString() };
    expect(store.addEvent(session.sessionId, event)?.duplicate).toBe(false);
    expect(store.addEvent(session.sessionId, event)?.duplicate).toBe(true);
    expect(store.get(session.sessionId)?.events).toHaveLength(1);
    expect(() => store.addEvent(session.sessionId, { ...event, sequence: 3 })).toThrow("Expected sequence 2");
  });

  it("moves to reconnecting when controller heartbeats stop", () => {
    let now = 1_000;
    const store = new ResidentGameSessionStore(() => now);
    const session = store.create();
    store.join(session.sessionId, session.pairingCode);
    now += 6_001;
    expect(store.get(session.sessionId)?.connectionState).toBe("reconnecting");
    expect(store.heartbeat(session.sessionId, "controller")?.connectionState).toBe("connected");
  });

  it("expires short-lived sessions", () => {
    let now = 1_000;
    const store = new ResidentGameSessionStore(() => now);
    const session = store.create();
    now += 15 * 60_000;
    expect(store.get(session.sessionId)?.connectionState).toBe("expired");
  });
});
