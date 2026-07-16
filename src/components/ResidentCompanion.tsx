// @ts-nocheck -- legacy Phase 1 home markup remains unreachable for rollback.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, BookHeart, Clock3, Flower2, Gauge, HelpCircle, Image, Loader2, LogOut, MessageCircle, Mic, Pause, Play, Send, Sparkles, Square, UserRound, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  buildDailySummary, buildFamilySummary, classifyResidentIntent, createSession,
  loadSession, saveSession, type CompanionActivity, type CompanionMessage, type CompanionSession
} from "../lib/residentCompanion";
import { persistResidentSession, type SyncState } from "../lib/residentActivityStore";
import { speechRate, supportsSpeechRecognition, supportsSpeechSynthesis } from "../lib/residentVoice";
import { FlowerMemoryMatch } from "./FlowerMemoryMatch";
import { loadPreference, savePreference, updatePreferenceFromSession, type ResidentPreference, type ResidentRecommendation } from "../lib/residentPersonalisation";
import { MemoryJournal, Recommendations } from "./ResidentPersonalisation";
import { ResidentHome } from "./ResidentHome";
import { LeisureGames } from "./LeisureGames";

const FLOWERS = [
  { title: "A peaceful rose garden", url: "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&q=80" },
  { title: "Australian wildflowers", url: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=80" },
  { title: "Sunflowers in the morning", url: "https://images.unsplash.com/photo-1470509037663-253afd7f0f51?auto=format&fit=crop&w=900&q=80" }
];

type View = "home" | "chat" | "flowers" | "game" | "leisure" | "memory" | "summary";
const nowMessage = (role: CompanionMessage["role"], text: string, intent?: CompanionMessage["intent"]): CompanionMessage => ({ id: crypto.randomUUID(), role, text, createdAt: new Date().toISOString(), intent });

export function ResidentCompanion() {
  const { logout } = useAuth();
  const [language, setLanguage] = useState<"en" | "zh">("en");
  const [view, setView] = useState<View>("home");
  const [session, setSession] = useState<CompanionSession>(() => loadSession() || createSession());
  const [preference, setPreference] = useState<ResidentPreference>(() => loadPreference());
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [assistance, setAssistance] = useState(false);
  const [activeActivity, setActiveActivity] = useState<CompanionActivity | null>(null);
  const [syncState, setSyncState] = useState<SyncState>(() => navigator.onLine ? "local" : "offline");
  const [listening, setListening] = useState(false);
  const [pendingTranscript, setPendingTranscript] = useState("");
  const [speechError, setSpeechError] = useState("");
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [slowerSpeech, setSlowerSpeech] = useState(false);
  const recognitionRef = useRef<any>(null);
  const dailySummary = useMemo(() => buildDailySummary(session), [session]);
  const familySummary = useMemo(() => buildFamilySummary(session), [session]);

  const words = language === "zh" ? {
    hello: "早上好，Mary。", prompt: "今天您想做什么？", hint: "您可以说话或输入任何想法。", talk: "和 Sunny 聊聊", type: "输入消息", show: "看看花和图片", game: "花朵配对游戏", surprise: "给我一个惊喜", help: "请求工作人员帮助", summary: "查看今日小结", ai: "Sunny 是 AI 伙伴，不是真人。活动记录可用于生成已授权的小结。不会保存原始语音。", placeholder: "例如：我想看看花……", send: "发送", back: "返回", curated: "经筛选的演示内容", close: "结束活动", daily: "Mary 的今日小结", family: "家属小结（演示）", noActivity: "完成一个活动后，小结会显示在这里。", assistance: "正在联系工作人员", assistanceBody: "这是演示环境中的模拟提醒。现场并未自动呼叫紧急服务。请留在安全的地方。", dismiss: "知道了", speak: "按下说话", listening: "正在听，请说话……", transcript: "发送前请确认文字", cancel: "取消", unavailable: "此浏览器不支持语音，请使用文字输入。", local: "已保存在此设备", synced: "已同步", offline: "离线：已保存在此设备"
  } : {
    hello: "Good morning, Mary.", prompt: "What would you like to do today?", hint: "You can speak to me or type anything.", talk: "Talk to Sunny", type: "Type a message", show: "Show me flowers", game: "Flower Memory Match", surprise: "Surprise me", help: "Ask staff for help", summary: "View today's summary", ai: "Sunny is an AI companion, not a person. Activity data may be used in authorised summaries. Raw audio is never saved.", placeholder: "For example: I want to see flowers…", send: "Send", back: "Back", curated: "Curated demo content", close: "Finish activity", daily: "Mary's daily summary", family: "Family summary (demo)", noActivity: "Complete an activity to see it here.", assistance: "Contacting a staff member", assistanceBody: "This is a simulated alert in the demo environment. Emergency services have not been called automatically. Please stay where it is safe.", dismiss: "I understand", speak: "Press to speak", listening: "Listening… please speak", transcript: "Check the words before sending", cancel: "Cancel", unavailable: "Speech is unavailable in this browser. Please type instead.", local: "Saved on this device", synced: "Synced", offline: "Offline: saved on this device"
  };

  useEffect(() => {
    const offline = () => setSyncState("offline");
    const online = () => setSyncState("local");
    window.addEventListener("offline", offline); window.addEventListener("online", online);
    return () => { window.removeEventListener("offline", offline); window.removeEventListener("online", online); window.speechSynthesis?.cancel(); recognitionRef.current?.abort?.(); };
  }, []);

  const commit = (next: CompanionSession) => {
    const nextPreference = updatePreferenceFromSession(preference, next);
    setSession(next); saveSession(next); setPreference(nextPreference); savePreference(nextPreference); setSyncState(navigator.onLine ? "local" : "offline");
    void persistResidentSession(next, nextPreference).then(setSyncState);
  };
  const updatePreference = (next: ResidentPreference) => { setPreference(next); savePreference(next); setSyncState(navigator.onLine ? "local" : "offline"); void persistResidentSession(session, next).then(setSyncState); };
  const chooseRecommendation = (action: ResidentRecommendation["action"]) => { if (action === "flowers") openFlowers(); else if (action === "game") openGame(); else if (action === "memory") setView("memory"); else setView("chat"); };
  const startMemoryPrompt = (prompt: string) => { setInput(prompt); setView("chat"); };

  const startListening = () => {
    setSpeechError("");
    if (!supportsSpeechRecognition()) { setSpeechError(words.unavailable); return; }
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new Recognition(); recognitionRef.current = recognition;
    recognition.lang = language === "zh" ? "zh-CN" : "en-AU"; recognition.interimResults = false; recognition.continuous = false; recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => { setPendingTranscript(event.results[0][0].transcript); setListening(false); };
    recognition.onerror = () => { setSpeechError(words.unavailable); setListening(false); };
    recognition.onend = () => setListening(false);
    setListening(true); recognition.start();
  };

  const stopListening = () => { recognitionRef.current?.stop?.(); setListening(false); };
  const speak = (message: CompanionMessage) => {
    if (!supportsSpeechSynthesis()) { setSpeechError(words.unavailable); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.text); utterance.lang = language === "zh" ? "zh-CN" : "en-AU"; utterance.rate = speechRate(slowerSpeech);
    utterance.onend = () => setSpeakingId(null); utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(message.id); window.speechSynthesis.speak(utterance);
  };
  const stopSpeaking = () => { window.speechSynthesis.cancel(); setSpeakingId(null); };

  const openFlowers = () => {
    const activity: CompanionActivity = { id: crypto.randomUUID(), type: "images", topic: "flowers", title: "Curated flower gallery", startedAt: new Date().toISOString(), completed: false };
    setActiveActivity(activity);
    setView("flowers");
  };

  const finishFlowers = () => {
    if (!activeActivity) return setView("home");
    const seconds = Math.max(1, Math.round((Date.now() - new Date(activeActivity.startedAt).getTime()) / 1000));
    commit({ ...session, activities: [...session.activities, { ...activeActivity, endedAt: new Date().toISOString(), durationSeconds: seconds, completed: true }] });
    setActiveActivity(null);
    setView("summary");
  };

  const openGame = () => { setActiveActivity({ id: crypto.randomUUID(), type: "memory_match", topic: "flowers", title: "Flower Memory Match", startedAt: new Date().toISOString(), completed: false }); setView("game"); };
  const finishGame = ({ state, completed, replayed }: { state: any; completed: boolean; replayed: boolean }) => {
    const base = activeActivity || { id: crypto.randomUUID(), type: "memory_match" as const, topic: "flowers", title: "Flower Memory Match", startedAt: state.startedAt, completed: false };
    const activity: CompanionActivity = { ...base, endedAt: new Date().toISOString(), durationSeconds: Math.max(1, Math.round((Date.now() - new Date(state.startedAt).getTime()) / 1000)), completed, cardFlips: state.flips, hintsUsed: state.hints, replayed };
    commit({ ...session, activities: [...session.activities, activity] }); setActiveActivity(null); setView("summary");
  };

  const submitMessage = async (preset?: string) => {
    const text = (preset || input).trim();
    if (!text || loading) return;
    const intent = classifyResidentIntent(text);
    const residentMessage = nowMessage("resident", text, intent);
    const withResident = { ...session, messages: [...session.messages, residentMessage] };
    commit(withResident); setInput(""); setError(""); setView("chat");
    if (intent.intent === "SAFETY_CONCERN" || intent.intent === "REQUEST_STAFF_HELP") {
      const reply = nowMessage("assistant", language === "zh" ? "我正在联系工作人员。请留在安全的地方。" : "I’m contacting a staff member now. Please stay where you are if it is safe to do so.");
      commit({ ...withResident, messages: [...withResident.messages, reply] });
      setAssistance(true); return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/resident-companion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, residentName: "Mary", language: intent.language, intent, recentMessages: withResident.messages.slice(-6), preferences: { favouriteTopics: preference.favouriteTopics, favouriteActivities: preference.favouriteActivities } }) });
      if (!response.ok) throw new Error("Sunny could not reply just now.");
      const data = await response.json();
      commit({ ...withResident, messages: [...withResident.messages, nowMessage("assistant", data.reply)] });
      if (data.action === "SHOW_FLOWERS") setTimeout(openFlowers, 500);
      if (data.action === "PLAY_FLOWER_MATCH") setTimeout(openGame, 500);
      if (/sudoku|数独|puzzle|拼图|match.?3|消消乐|连连看|休闲游戏/i.test(text)) setTimeout(() => setView("leisure"), 500);
      if (intent.intent === "SHARE_MEMORY") setTimeout(() => setView("memory"), 500);
      if (/summary|report|小结|总结|报告/i.test(text)) setTimeout(() => setView("summary"), 500);
    } catch {
      const fallback = intent.topic === "flowers" ? (language === "zh" ? "当然可以，Mary。这里有一些宁静的花园图片。" : "Of course, Mary. I found some peaceful flower pictures for you.") : (language === "zh" ? "我现在无法连接。我们可以稍后再试，或者看看花。" : "I cannot connect just now. We can try again, or look at some flowers.");
      commit({ ...withResident, messages: [...withResident.messages, nowMessage("assistant", fallback)] });
      setError(language === "zh" ? "AI 服务暂时不可用，已使用安全演示回复。" : "AI service unavailable; using a safe demo reply.");
      if (intent.intent === "PLAY_ACTIVITY" && intent.topic === "flowers") setTimeout(openGame, 500);
      else if (/sudoku|数独|puzzle|拼图|match.?3|消消乐|连连看|休闲游戏/i.test(text)) setTimeout(() => setView("leisure"), 500);
      else if (intent.intent === "SHARE_MEMORY") setTimeout(() => setView("memory"), 500);
      else if (/summary|report|小结|总结|报告/i.test(text)) setTimeout(() => setView("summary"), 500);
      else if (intent.topic === "flowers") setTimeout(openFlowers, 500);
    } finally { setLoading(false); }
  };

  if (assistance) return <div className="min-h-screen bg-red-50 flex items-center justify-center p-6"><div role="alert" className="max-w-xl w-full bg-white border-4 border-red-500 rounded-[2rem] p-8 text-center shadow-xl"><HelpCircle className="w-20 h-20 text-red-600 mx-auto mb-5"/><h1 className="text-4xl font-bold text-red-900 mb-4">{words.assistance}</h1><p className="text-xl leading-relaxed text-slate-700 mb-8">{words.assistanceBody}</p><button onClick={() => setAssistance(false)} className="min-h-16 w-full rounded-2xl bg-red-600 text-white text-xl font-bold">{words.dismiss}</button></div></div>;

  if (view === "home") return <ResidentHome language={language} onTalk={() => setView("chat")} onLanguage={() => { const next = language === "en" ? "zh" : "en"; setLanguage(next); updatePreference({ ...preference, preferredLanguage: next }); }} onLogout={() => logout()} syncLabel={words[syncState]}/>;

  return (
    <div className="min-h-screen bg-[#fbf7ef] text-[#28382f] font-sans">
      <header className="border-b border-orange-200 bg-[#fffaf2] px-4 py-4"><div className="max-w-6xl mx-auto flex items-center justify-between gap-3"><button onClick={() => setView("home")} className="flex items-center gap-3 text-xl font-bold"><span className="w-12 h-12 rounded-full bg-orange-400 flex items-center justify-center text-white"><Sparkles className="w-7 h-7"/></span>Sunny</button><div className="flex items-center gap-2"><span role="status" className="hidden sm:inline px-3 py-2 rounded-xl bg-slate-100 text-sm font-bold">{words[syncState]}</span><button onClick={() => { const next = language === "en" ? "zh" : "en"; setLanguage(next); updatePreference({ ...preference, preferredLanguage: next }); }} className="min-h-12 px-4 rounded-xl border-2 border-sage-700 bg-white text-lg font-semibold">{language === "en" ? "中文" : "English"}</button><button aria-label="Sign out" onClick={() => logout()} className="min-w-12 min-h-12 rounded-xl border-2 border-orange-200 bg-white flex items-center justify-center"><LogOut/></button></div></div></header>
      <main className="max-w-6xl mx-auto p-4 sm:p-8">
        {/* @ts-ignore legacy branch is unreachable after the ResidentHome return */}
        {view !== "home" && view !== "game" && <button onClick={() => setView("home")} className="min-h-12 px-4 mb-5 rounded-xl bg-white border-2 border-orange-200 text-lg font-bold flex items-center gap-2"><ArrowLeft/> {words.back}</button>}
        {view === "home" && <><section className="py-6 sm:py-10 text-center"><div className="w-20 h-20 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-5"><UserRound className="w-11 h-11"/></div><h1 className="text-4xl sm:text-5xl font-bold mb-4">{words.hello}</h1><p className="text-3xl sm:text-4xl font-semibold mb-3">{words.prompt}</p><p className="text-xl text-slate-600">{words.hint}</p></section><section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
          <button onClick={() => setView("chat")} className="resident-action bg-orange-500 text-white"><MessageCircle/><span>{words.talk}</span></button>
          <button onClick={() => setView("chat")} className="resident-action bg-white border-2 border-orange-200"><Send/><span>{words.type}</span></button>
          <button onClick={openFlowers} className="resident-action bg-[#dce8d7] border-2 border-[#acc5a4]"><Flower2/><span>{words.show}</span></button>
          <button onClick={openGame} className="resident-action bg-[#e9e2f4] border-2 border-[#c4b1da]"><Flower2/><span>{words.game}</span></button>
          <button onClick={() => submitMessage(language === "zh" ? "请给我一个惊喜" : "Surprise me with flowers")} className="resident-action bg-[#fff0cf] border-2 border-[#ebcc87]"><Sparkles/><span>{words.surprise}</span></button>
          <button onClick={() => setAssistance(true)} className="resident-action bg-white border-2 border-red-200 text-red-800"><HelpCircle/><span>{words.help}</span></button>
          <button onClick={() => setView("memory")} className="resident-action bg-[#fff0e0] border-2 border-orange-200"><BookHeart/><span>{language === "zh" ? "分享回忆" : "Share a Memory"}</span></button>
          <button onClick={() => setView("summary")} className="resident-action bg-white border-2 border-orange-200"><Clock3/><span>{words.summary}</span></button>
        </section><Recommendations profile={preference} onAction={chooseRecommendation}/><section className="mt-10 bg-white border-2 border-orange-100 rounded-3xl p-6"><h2 className="text-3xl font-bold mb-4">Conversation Suggestions</h2><div className="flex flex-wrap gap-3">{["What was your favourite place when you were young?", "Who inspired you the most?", "What music do you enjoy?", "What flowers do you like the most?"].map(suggestion => <button key={suggestion} onClick={() => startMemoryPrompt(suggestion)} className="min-h-14 px-4 rounded-2xl bg-[#dce8d7] border-2 border-[#acc5a4] text-lg font-bold">{suggestion}</button>)}</div></section><p className="mt-8 text-center text-base text-slate-600 max-w-2xl mx-auto">{words.ai}</p></>}
        {view === "chat" && <section className="max-w-3xl mx-auto"><div className="bg-white border-2 border-orange-100 rounded-[2rem] min-h-[360px] p-5 sm:p-8 space-y-4 shadow-sm"><div className="flex gap-3"><span className="w-12 h-12 shrink-0 rounded-full bg-orange-400 text-white flex items-center justify-center"><Sparkles/></span><p className="bg-orange-50 rounded-2xl p-4 text-xl">{language === "zh" ? "您好，Mary。我是 AI 伙伴 Sunny。今天想做什么？" : "Hello Mary. I’m Sunny, an AI companion. What would you like to do?"}</p></div>{session.messages.slice(-8).map(message => <div key={message.id} className={`flex ${message.role === "resident" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl p-4 text-xl leading-relaxed ${message.role === "resident" ? "bg-[#dce8d7]" : "bg-orange-50"}`}>{message.text}</div></div>)}{loading && <div className="flex items-center gap-3 text-lg text-slate-600"><Loader2 className="animate-spin"/> Sunny is thinking…</div>}{error && <p className="text-amber-800 bg-amber-50 p-3 rounded-xl">{error}</p>}</div><form onSubmit={e => { e.preventDefault(); submitMessage(); }} className="mt-4 flex flex-col sm:flex-row gap-3"><label className="sr-only" htmlFor="resident-message">{words.type}</label><input id="resident-message" value={input} onChange={e => setInput(e.target.value)} maxLength={500} placeholder={words.placeholder} className="flex-1 min-h-16 rounded-2xl border-2 border-orange-200 bg-white px-5 text-xl outline-none focus:ring-4 focus:ring-orange-200"/><button disabled={!input.trim() || loading} className="min-h-16 px-7 rounded-2xl bg-orange-500 text-white text-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"><Send/> {words.send}</button></form></section>}
        {view === "flowers" && <section><div className="flex flex-wrap justify-between items-center gap-3 mb-6"><div><span className="inline-flex px-3 py-1 rounded-full bg-green-100 text-green-800 font-bold mb-2">{words.curated}</span><h1 className="text-4xl font-bold">{language === "zh" ? "为 Mary 精选的花" : "Flowers selected for Mary"}</h1></div><button onClick={finishFlowers} className="min-h-14 px-6 rounded-2xl bg-[#45634f] text-white text-xl font-bold flex items-center gap-2"><X/> {words.close}</button></div><div className="grid md:grid-cols-3 gap-5">{FLOWERS.map(item => <figure key={item.title} className="overflow-hidden rounded-[2rem] bg-white border-2 border-orange-100 shadow-sm"><img src={item.url} alt={item.title} className="h-64 w-full object-cover"/><figcaption className="p-5 text-xl font-bold flex gap-2"><Image className="text-orange-500 shrink-0"/> {item.title}</figcaption></figure>)}</div><p className="mt-5 text-slate-600 text-center">Images: Unsplash · preview only · no autoplay</p></section>}
        {view === "game" && <FlowerMemoryMatch language={language} replayed={session.activities.some(activity => activity.type === "memory_match")} onExit={finishGame} />}
        {view === "leisure" && <LeisureGames onExit={() => setView("chat")}/>}
        {view === "memory" && <MemoryJournal language={language} profile={preference} session={session} onChange={updatePreference} onTalk={startMemoryPrompt}/>}
        {view === "summary" && <section className="max-w-4xl mx-auto"><h1 className="text-4xl font-bold mb-6">{words.daily}</h1>{session.activities.length === 0 ? <div className="bg-white rounded-3xl p-8 text-xl border-2 border-orange-100">{words.noActivity}</div> : <div className="grid md:grid-cols-2 gap-5"><article className="bg-white rounded-3xl p-7 border-2 border-orange-100"><h2 className="text-2xl font-bold mb-4">{language === "zh" ? "活动记录" : "Activity record"}</h2>{dailySummary.activities.map((activity, i) => <p key={i} className="text-xl mb-3">• {activity.completed ? "✓" : "–"} {activity.topic} · {activity.durationMinutes} min</p>)}<p className="mt-6 text-lg text-slate-600">{dailySummary.followUpSuggestion}</p></article><article className="bg-[#fff0e0] rounded-3xl p-7 border-2 border-orange-200"><h2 className="text-2xl font-bold mb-4">{words.family}</h2><p className="text-xl leading-relaxed">{familySummary}</p><p className="text-sm text-slate-600 mt-6">Demo summary based only on observable activity. No emotion or clinical inference.</p></article></div>}</section>}
        {view === "chat" && <aside className="max-w-3xl mx-auto mt-5 bg-[#fff0cf] border-2 border-[#e3c06e] rounded-3xl p-4 sm:p-5">
          <div className="grid sm:grid-cols-2 gap-3"><button type="button" onClick={listening ? stopListening : startListening} className={`min-h-20 rounded-2xl text-xl font-bold flex items-center justify-center gap-3 ${listening ? "bg-red-600 text-white" : "bg-[#45634f] text-white"}`}>{listening ? <Pause/> : <Mic/>}{listening ? words.listening : words.speak}</button><div className="grid grid-cols-3 gap-2"><button onClick={() => { const message = [...session.messages].reverse().find(item => item.role === "assistant"); if (message) speak(message); }} className="min-h-20 rounded-2xl bg-white border-2 border-orange-300 font-bold flex flex-col items-center justify-center"><Play/>Play</button><button onClick={stopSpeaking} className="min-h-20 rounded-2xl bg-white border-2 border-orange-300 font-bold flex flex-col items-center justify-center"><Square/>Stop</button><button aria-pressed={slowerSpeech} onClick={() => setSlowerSpeech(value => !value)} className={`min-h-20 rounded-2xl border-2 font-bold flex flex-col items-center justify-center ${slowerSpeech ? "bg-green-100 border-green-500" : "bg-white border-orange-300"}`}><Gauge/>Slower</button></div></div>
          {speechError && <p className="mt-3 p-3 bg-white rounded-xl text-amber-900">{speechError}</p>}
          {pendingTranscript && <div role="dialog" aria-label={words.transcript} className="mt-4"><h2 className="text-xl font-bold mb-2">{words.transcript}</h2><input value={pendingTranscript} onChange={event => setPendingTranscript(event.target.value)} className="w-full min-h-16 rounded-2xl border-2 border-orange-300 px-4 text-xl"/><div className="flex gap-3 mt-3"><button onClick={() => { setInput(pendingTranscript); setPendingTranscript(""); }} className="min-h-14 flex-1 rounded-2xl bg-orange-500 text-white text-lg font-bold">{language === "zh" ? "使用这段文字" : "Use transcript"}</button><button onClick={() => setPendingTranscript("")} className="min-h-14 flex-1 rounded-2xl bg-white border-2 border-orange-300 text-lg font-bold">{words.cancel}</button></div></div>}
          <p className="mt-3 text-sm text-slate-700">{language === "zh" ? "录音只在按键后开始；不会保存原始语音。" : "Recording starts only after you press the button. Raw audio is not stored."}</p>
        </aside>}
      </main>
    </div>
  );
}
