import React, { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronRight, DoorOpen, Flower2, Wifi, WifiOff } from "lucide-react";

type Connection = "pairing" | "connected" | "reconnecting" | "ended" | "error";
type Action = "next-card" | "choose-card" | "exit";

export function FlowerMatchController() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session") || "";
  const pairingCode = params.get("code") || "";
  const sequenceKey = `flower-controller-sequence:${sessionId}`;
  const sequence = useRef(Number(sessionStorage.getItem(sequenceKey)) || 0);
  const [connection, setConnection] = useState<Connection>("pairing");
  const [message, setMessage] = useState("Connecting to the flower garden…");
  const [busy, setBusy] = useState(false);

  const join = useCallback(async () => {
    if (!sessionId || !pairingCode) { setConnection("error"); setMessage("This pairing link is incomplete. Please scan the QR code again."); return; }
    try {
      const response = await fetch(`/api/game-sessions/${encodeURIComponent(sessionId)}/join`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pairingCode }),
      });
      if (!response.ok) throw new Error();
      const session = await response.json();
      sequence.current = Math.max(sequence.current, Number(session.lastSequence) || 0);
      sessionStorage.setItem(sequenceKey, String(sequence.current));
      setConnection("connected"); setMessage("Connected. Sunny is ready with you.");
    } catch { setConnection("reconnecting"); setMessage("We’re reconnecting. Please keep this page open."); }
  }, [pairingCode, sequenceKey, sessionId]);

  useEffect(() => { void join(); }, [join]);
  useEffect(() => {
    if (connection === "ended" || connection === "error") return;
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/game-sessions/${encodeURIComponent(sessionId)}/heartbeat`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "controller" }),
        });
        if (!response.ok) throw new Error();
        const session = await response.json();
        if (session.connectionState === "ended" || session.connectionState === "expired") { setConnection("ended"); setMessage("This flower activity has ended."); }
        else if (connection !== "connected") void join();
      } catch { setConnection("reconnecting"); setMessage("Connection paused. We’ll keep trying for you."); }
    }, 2_000);
    return () => window.clearInterval(timer);
  }, [connection, join, sessionId]);

  const send = async (actionId: Action, label: string) => {
    if (busy || connection !== "connected") return;
    setBusy(true);
    const nextSequence = sequence.current + 1;
    try {
      const response = await fetch(`/api/game-sessions/${encodeURIComponent(sessionId)}/events`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, actionId, sequence: nextSequence, occurredAt: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error();
      const result = await response.json();
      sequence.current = Number(result.acceptedSequence);
      sessionStorage.setItem(sequenceKey, String(sequence.current));
      if (actionId === "exit") { setConnection("ended"); setMessage("The activity has ended safely."); }
      else { setMessage(`${label} — Sunny received it.`); window.navigator.vibrate?.(40); }
    } catch { setConnection("reconnecting"); setMessage("That didn’t reach the garden yet. We’ll reconnect safely."); }
    finally { setBusy(false); }
  };

  const connected = connection === "connected";
  return <main className="flower-controller min-h-[100dvh] bg-[#fffaf0] text-[#173d2a] flex flex-col p-5 sm:p-7">
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 text-2xl font-bold"><span className="w-14 h-14 rounded-full bg-[#ffe4a3] flex items-center justify-center">☀️</span>MOMENT</div>
      <div role="status" className={`flex items-center gap-2 rounded-full px-4 py-3 font-bold ${connected ? "bg-[#e1eedb]" : "bg-[#fff0d5]"}`}>
        {connected ? <Wifi aria-hidden="true"/> : <WifiOff aria-hidden="true"/>}{connection === "pairing" ? "Pairing" : connection === "reconnecting" ? "Reconnecting" : connection === "ended" ? "Ended" : connection === "error" ? "Not connected" : "Connected"}
      </div>
    </header>
    <section className="flex-1 flex flex-col justify-center py-7">
      <div aria-live="polite" className="min-h-24 bg-white border-2 border-[#e9ddc8] rounded-3xl p-5 text-center text-xl font-bold flex items-center justify-center gap-3 shadow-sm">
        {connected && <CheckCircle2 className="text-[#56805e]" aria-hidden="true"/>}{message}
      </div>
      <p className="controller-helper text-center text-xl mt-7 mb-4">Use one button at a time. There is no hurry.</p>
      <div className="controller-actions grid grid-cols-1 gap-4 flex-1 max-h-[520px]">
        <button disabled={!connected || busy} onClick={() => send("next-card", "Next flower highlighted")} className="min-h-36 rounded-[2rem] bg-[#dcebd7] border-4 border-[#88aa83] text-[#173d2a] text-3xl font-bold flex flex-col items-center justify-center gap-3 shadow-md focus:outline-none focus:ring-8 focus:ring-[#f5bf55] disabled:opacity-50">
          <ChevronRight size={58} aria-hidden="true"/><span>Next flower</span>
        </button>
        <button disabled={!connected || busy} onClick={() => send("choose-card", "Flower chosen")} className="min-h-36 rounded-[2rem] bg-[#fff0bd] border-4 border-[#e5b64e] text-[#173d2a] text-3xl font-bold flex flex-col items-center justify-center gap-3 shadow-md focus:outline-none focus:ring-8 focus:ring-[#82a985] disabled:opacity-50">
          <Flower2 size={58} aria-hidden="true"/><span>Choose flower</span>
        </button>
      </div>
    </section>
    <button disabled={connection === "ended"} onClick={() => send("exit", "Activity ended")} className="min-h-24 rounded-3xl border-3 border-[#b95f54] bg-white text-[#8b332c] text-2xl font-bold flex items-center justify-center gap-3 focus:outline-none focus:ring-8 focus:ring-[#f1b8b2] disabled:opacity-50">
      <DoorOpen size={36} aria-hidden="true"/>End activity
    </button>
  </main>;
}
