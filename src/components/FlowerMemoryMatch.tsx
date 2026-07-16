import React, { useEffect, useState } from "react";
import { ArrowLeft, Lightbulb, RotateCcw } from "lucide-react";
import { clearUnmatchedSelection, createFlowerGame, selectFlowerCard, useFlowerHint, type FlowerGameState } from "../lib/flowerMemoryGame";

interface Props {
  language: "en" | "zh";
  replayed: boolean;
  onExit: (result: { state: FlowerGameState; completed: boolean; replayed: boolean }) => void;
}

export function FlowerMemoryMatch({ language, replayed, onExit }: Props) {
  const [game, setGame] = useState(() => createFlowerGame());
  const [hintIds, setHintIds] = useState<string[]>([]);
  const [hasReplayed, setHasReplayed] = useState(replayed);
  const text = language === "zh" ? { title: "花朵配对", instruction: "一次翻开两张卡片，找出相同的花。", restart: "重新开始", hint: "提示", exit: "退出", flips: "翻牌次数", hints: "提示次数", done: "完成了！所有花朵都配对成功。", finish: "查看活动小结" } : { title: "Flower Memory Match", instruction: "Turn over two cards at a time. Find the matching flowers.", restart: "Restart", hint: "Hint", exit: "Exit", flips: "Card flips", hints: "Hints", done: "Complete! You matched all the flowers.", finish: "View activity summary" };

  useEffect(() => {
    if (game.selectedIds.length !== 2) return;
    const selected = game.selectedIds.map(id => game.cards.find(card => card.id === id));
    if (selected[0]?.pair === selected[1]?.pair) return;
    const timer = window.setTimeout(() => setGame(current => clearUnmatchedSelection(current)), 900);
    return () => window.clearTimeout(timer);
  }, [game.selectedIds, game.cards]);

  const choose = (id: string) => setGame(current => selectFlowerCard(current, id));
  const hint = () => {
    const result = useFlowerHint(game); setGame(result.state); setHintIds(result.pairIds);
    window.setTimeout(() => setHintIds([]), 1200);
  };
  const restart = () => { setGame(createFlowerGame()); setHintIds([]); setHasReplayed(true); };

  return <section className="max-w-4xl mx-auto">
    <div className="flex flex-wrap justify-between gap-4 mb-5"><div><h1 className="text-4xl sm:text-5xl font-bold mb-2">{text.title}</h1><p className="text-xl text-slate-600">{text.instruction}</p></div><button onClick={() => onExit({ state: game, completed: Boolean(game.completedAt), replayed: hasReplayed })} className="min-h-14 px-5 rounded-2xl bg-white border-2 border-orange-200 text-xl font-bold flex items-center gap-2"><ArrowLeft/> {text.exit}</button></div>
    <div aria-live="polite" className="flex flex-wrap gap-3 mb-5 text-lg font-bold"><span className="bg-white rounded-xl px-4 py-3 border border-orange-200">{text.flips}: {game.flips}</span><span className="bg-white rounded-xl px-4 py-3 border border-orange-200">{text.hints}: {game.hints}</span></div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 mb-6">{game.cards.map(card => {
      const visible = card.matched || game.selectedIds.includes(card.id) || hintIds.includes(card.id);
      return <button key={card.id} disabled={card.matched || game.selectedIds.length >= 2 || Boolean(game.completedAt)} onClick={() => choose(card.id)} aria-label={visible ? card.label : (language === "zh" ? "未翻开的花朵卡片" : "Hidden flower card")} className={`aspect-[4/5] min-h-32 rounded-3xl border-4 text-5xl sm:text-6xl flex flex-col items-center justify-center gap-2 transition-transform ${card.matched ? "bg-green-100 border-green-400" : visible ? "bg-white border-orange-400 scale-[1.02]" : "bg-[#56755f] border-[#3e5947] text-white"}`}><span>{visible ? card.symbol : "?"}</span>{visible && <span className="text-base sm:text-lg font-bold text-slate-800">{card.label}</span>}</button>})}</div>
    {game.completedAt && <div role="status" className="bg-green-100 border-2 border-green-400 rounded-3xl p-6 mb-5 text-center"><p className="text-2xl font-bold mb-4">{text.done}</p><button onClick={() => onExit({ state: game, completed: true, replayed: hasReplayed })} className="min-h-16 px-7 bg-[#45634f] text-white rounded-2xl text-xl font-bold">{text.finish}</button></div>}
    <div className="flex flex-col sm:flex-row gap-3"><button onClick={restart} className="min-h-16 flex-1 rounded-2xl bg-white border-2 border-orange-300 text-xl font-bold flex items-center justify-center gap-2"><RotateCcw/> {text.restart}</button><button disabled={Boolean(game.completedAt)} onClick={hint} className="min-h-16 flex-1 rounded-2xl bg-[#fff0cf] border-2 border-[#e3c06e] text-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"><Lightbulb/> {text.hint}</button></div>
  </section>;
}
