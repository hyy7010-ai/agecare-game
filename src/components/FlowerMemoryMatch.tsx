import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Phone, RefreshCw, WifiOff } from "lucide-react";
import { clearUnmatchedSelection, createFlowerGame, selectFlowerCard, type FlowerGameState } from "../lib/flowerMemoryGame";

interface Props {
  language: "en" | "zh";
  replayed: boolean;
  onExit: (result: { state: FlowerGameState; completed: boolean; replayed: boolean }) => void;
}

type PairingSession = {
  sessionId: string;
  pairingCode: string;
  controllerUrl: string;
  connectionState: "waiting" | "connected" | "reconnecting" | "ended" | "expired";
};

type QRFactory = (typeNumber: number, errorCorrectionLevel: string) => {
  addData: (value: string) => void; make: () => void; createSvgTag: (cellSize: number, margin: number) => string;
};

declare global { interface Window { qrcode?: QRFactory } }

function PairingCode({ value }: { value: string }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    const render = () => {
      if (!window.qrcode) return;
      const qr = window.qrcode(0, "M"); qr.addData(value); qr.make(); setSvg(qr.createSvgTag(6, 2));
    };
    if (window.qrcode) { render(); return; }
    const script = document.createElement("script");
    script.src = `${import.meta.env.BASE_URL}moment/vendor/qrcode.min.js`;
    script.onload = render; document.head.appendChild(script);
    return () => { script.onload = null; };
  }, [value]);
  return <div className="w-64 h-64 bg-white rounded-3xl p-4 shadow-md flex items-center justify-center" aria-label="QR code for the phone controller" dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function FlowerMemoryMatch({ language, replayed, onExit }: Props) {
  const [game, setGame] = useState(() => createFlowerGame());
  const [session, setSession] = useState<PairingSession | null>(null);
  const [pairingError, setPairingError] = useState("");
  const [focusIndex, setFocusIndex] = useState(0);
  const [acknowledgement, setAcknowledgement] = useState("Sunny is waiting for your phone.");
  const [hasReplayed] = useState(replayed);
  const lastSequence = useRef(0);
  const gameRef = useRef(game);
  const focusRef = useRef(focusIndex);
  gameRef.current = game;
  focusRef.current = focusIndex;

  const finish = useCallback((state = gameRef.current) => onExit({ state, completed: Boolean(state.completedAt), replayed: hasReplayed }), [hasReplayed, onExit]);

  const createSession = useCallback(async () => {
    setPairingError(""); setSession(null); setAcknowledgement("Sunny is preparing the flower garden."); lastSequence.current = 0;
    try {
      const response = await fetch("/api/game-sessions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: "flower-memory", basePath: import.meta.env.BASE_URL }),
      });
      if (!response.ok) throw new Error();
      const next = await response.json(); setSession(next); setAcknowledgement("Scan the QR code with your phone. We’ll wait here together.");
    } catch { setPairingError("The phone connection is not available. Please check that the full MOMENT server is running, then try again."); }
  }, []);

  useEffect(() => { void createSession(); }, [createSession]);
  useEffect(() => {
    if (!session || session.connectionState === "ended" || session.connectionState === "expired") return;
    let active = true;
    const poll = async () => {
      try {
        const response = await fetch(`/api/game-sessions/${encodeURIComponent(session.sessionId)}?role=display&afterSequence=${lastSequence.current}`, { cache: "no-store" });
        if (!response.ok) throw new Error();
        const snapshot = await response.json();
        if (!active) return;
        setSession(current => current ? { ...current, connectionState: snapshot.connectionState } : current);
        if (snapshot.connectionState === "connected") setAcknowledgement(current => current.includes("received") || current.includes("matched") ? current : "Connected! Use your phone to choose a flower.");
        if (snapshot.connectionState === "reconnecting") setAcknowledgement("The phone connection paused. The garden will wait while we reconnect.");
        for (const event of snapshot.events || []) {
          if (event.sequence <= lastSequence.current) continue;
          lastSequence.current = event.sequence;
          if (event.actionId === "next-card") {
            const cards = gameRef.current.cards;
            let next = focusRef.current;
            do { next = (next + 1) % cards.length; } while (cards[next].matched && next !== focusRef.current);
            focusRef.current = next; setFocusIndex(next); setAcknowledgement(`Flower ${next + 1} is highlighted.`);
          } else if (event.actionId === "choose-card") {
            const chosen = gameRef.current.cards[focusRef.current];
            if (chosen.matched) setAcknowledgement("That pair is already blooming. Choose another flower.");
            else {
              setGame(current => {
                const next = selectFlowerCard(current, chosen.id); gameRef.current = next;
                if (next === current) setAcknowledgement("Choose the next flower when you’re ready.");
                else if (next.completedAt) setAcknowledgement("Wonderful! Every flower has found its partner.");
                else if (next.selectedIds.length === 0) setAcknowledgement("A lovely match! Let’s find another pair.");
                else setAcknowledgement("Beautiful choice. Now find its matching flower.");
                return next;
              });
            }
          } else if (event.actionId === "exit") {
            setAcknowledgement("The activity has ended safely. Thank you for visiting the garden.");
            window.setTimeout(() => finish(), 700);
          }
        }
      } catch {
        if (active) { setSession(current => current ? { ...current, connectionState: "reconnecting" } : current); setAcknowledgement("The connection paused. We’ll keep the flowers safe while we reconnect."); }
      }
    };
    void poll(); const timer = window.setInterval(poll, 750);
    return () => { active = false; window.clearInterval(timer); };
  }, [finish, session?.sessionId]);

  useEffect(() => {
    if (game.selectedIds.length !== 2) return;
    const selected = game.selectedIds.map(id => game.cards.find(card => card.id === id));
    if (selected[0]?.pair === selected[1]?.pair) return;
    setAcknowledgement("Those flowers are different, and that’s quite all right. Let’s try another pair.");
    const timer = window.setTimeout(() => setGame(current => clearUnmatchedSelection(current)), 1_300);
    return () => window.clearTimeout(timer);
  }, [game.selectedIds, game.cards]);

  const endFromDisplay = async () => {
    if (session) void fetch(`/api/game-sessions/${encodeURIComponent(session.sessionId)}/end`, { method: "POST" });
    finish();
  };

  const connected = session?.connectionState === "connected";
  if (!connected) return <section className="max-w-5xl mx-auto min-h-[75vh] flex flex-col">
    <div className="flex justify-between items-start gap-4 mb-6"><div><p className="uppercase tracking-[.18em] font-bold text-[#56805e]">Flower Memory Match</p><h1 className="text-4xl sm:text-6xl font-bold mt-2">Let’s connect your phone</h1><p className="text-xl text-slate-600 mt-3">Your phone will become a simple two-button controller.</p></div><button onClick={endFromDisplay} className="min-h-14 px-5 rounded-2xl bg-white border-2 border-[#d9cbb8] text-xl font-bold flex items-center gap-2"><ArrowLeft/>Exit</button></div>
    <div className="flex-1 rounded-[2.5rem] bg-gradient-to-br from-[#eef5e9] to-[#fff4d6] border-2 border-white shadow-xl p-6 sm:p-10 grid md:grid-cols-[1fr_auto] items-center gap-8">
      <div><div className="flex items-center gap-4 mb-6"><span className="text-7xl sunny-breathe">☀️</span><div role="status" aria-live="polite" className="bg-white rounded-3xl p-5 text-xl font-bold shadow-sm">{acknowledgement}</div></div>
        {pairingError ? <div className="bg-[#fff0e8] border-2 border-[#dc8c6d] rounded-3xl p-6 text-xl"><p>{pairingError}</p><button onClick={createSession} className="mt-5 min-h-16 px-6 rounded-2xl bg-[#45634f] text-white font-bold flex items-center gap-2"><RefreshCw/>Try again</button></div> : session ? <><ol className="space-y-4 text-xl"><li><strong>1.</strong> Open your phone camera.</li><li><strong>2.</strong> Scan the QR code.</li><li><strong>3.</strong> Keep the controller page open.</li></ol><div className="mt-6 inline-flex items-center gap-3 bg-white/80 rounded-2xl px-5 py-4 text-xl font-bold">Pairing code <span className="tracking-[.25em] text-2xl">{session.pairingCode}</span></div>{session.connectionState === "reconnecting" && <p className="mt-5 flex items-center gap-2 text-xl font-bold text-[#8b5c20]"><WifiOff/>Waiting for the phone to reconnect…</p>}</> : <p className="flex items-center gap-3 text-xl"><Loader2 className="animate-spin"/>Creating a private, short-lived session…</p>}
      </div>{session && <div className="text-center"><PairingCode value={session.controllerUrl}/><p className="mt-4 text-lg font-bold flex items-center justify-center gap-2"><Phone/>Scan to connect</p></div>}
    </div>
  </section>;

  return <section className="max-w-5xl mx-auto">
    <header className="flex flex-wrap justify-between items-start gap-4 mb-5"><div><p className="uppercase tracking-[.18em] font-bold text-[#56805e]">Playing together with Sunny</p><h1 className="text-4xl sm:text-5xl font-bold mt-2">Flower Memory Match</h1><p className="text-xl text-slate-600 mt-2">Use the two large buttons on your phone. No screen tapping is needed here.</p></div><div className="flex gap-3"><span className="min-h-14 px-5 rounded-2xl bg-[#e1eedb] text-xl font-bold flex items-center gap-2"><CheckCircle2/>Phone connected</span><button onClick={endFromDisplay} className="min-h-14 px-5 rounded-2xl bg-white border-2 border-[#d9cbb8] text-xl font-bold"><ArrowLeft/> Exit</button></div></header>
    <div aria-live="polite" className="mb-5 min-h-20 bg-[#fff8e6] border-2 border-[#efd494] rounded-3xl p-5 text-center text-2xl font-bold flex items-center justify-center gap-3"><span className="text-4xl">☀️</span>{acknowledgement}</div>
    <div className="grid grid-cols-4 gap-3 sm:gap-5 mb-6" aria-label="Flower card game controlled from the paired phone">{game.cards.map((card, index) => {
      const visible = card.matched || game.selectedIds.includes(card.id);
      return <div key={card.id} aria-current={focusIndex === index ? "true" : undefined} className={`aspect-[4/5] min-h-32 rounded-3xl border-[6px] text-5xl sm:text-6xl flex flex-col items-center justify-center gap-2 transition-transform ${card.matched ? "bg-[#dcebd7] border-[#74a06f]" : visible ? "bg-white border-[#e9a846]" : focusIndex === index ? "bg-[#fff3bd] border-[#e19a31] scale-[1.04] shadow-xl" : "bg-[#56755f] border-[#3e5947] text-white"}`}><span>{visible ? card.symbol : "?"}</span>{visible && <span className="text-base sm:text-lg font-bold text-slate-800">{card.label}</span>}{focusIndex === index && !card.matched && <span className="text-sm font-bold text-[#5c3a12]">Highlighted</span>}</div>;
    })}</div>
    {game.completedAt && <div role="status" className="bg-[#e1eedb] border-2 border-[#74a06f] rounded-3xl p-7 text-center"><p className="text-3xl font-bold">Wonderful! You matched all the flowers.</p><p className="text-xl mt-2">You can finish here whenever you’re ready.</p><button onClick={() => finish(game)} className="mt-5 min-h-16 px-7 bg-[#45634f] text-white rounded-2xl text-xl font-bold">View activity summary</button></div>}
  </section>;
}
