import React from "react";
import { MessageCircle, Sparkles, Sun } from "lucide-react";

interface Props {
  language: "en" | "zh";
  onTalk: () => void;
  onLanguage: () => void;
  onLogout: () => void;
  syncLabel: string;
}

export function ResidentHome({ language, onTalk, onLanguage, onLogout, syncLabel }: Props) {
  const zh = language === "zh";
  return <div className="min-h-screen bg-[#fbf7ef] text-[#293a30] flex flex-col">
    <header className="max-w-5xl w-full mx-auto p-5 flex justify-end items-center gap-3">
      <span className="mr-auto hidden sm:block text-sm font-bold text-[#617067]">{syncLabel}</span>
      <button onClick={onLanguage} className="px-5 min-h-12 bg-white rounded-full border border-[#ded8ca] font-bold">{zh ? "English" : "中文"}</button>
      <button onClick={onLogout} className="px-4 min-h-12 font-bold text-[#617067]">{zh ? "退出" : "Exit"}</button>
    </header>
    <main className="flex-1 flex items-center justify-center px-5 pb-20">
      <section className="text-center max-w-3xl">
        <div className="sunny-breathe mx-auto w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-[#e7893c] text-white flex items-center justify-center shadow-[0_24px_65px_rgba(201,112,32,.28)]" aria-label="Sunny AI companion">
          <Sparkles className="w-20 h-20"/>
        </div>
        <p className="mt-7 text-sm tracking-[.25em] uppercase font-bold text-[#c66f2a]">Sunny Companion</p>
        <h1 className="text-4xl sm:text-6xl font-bold mt-4">{zh ? "早上好，Mary！" : "Good morning, Mary!"}</h1>
        <p className="text-xl sm:text-2xl text-[#5d6e63] mt-5 leading-relaxed">
          {zh ? "我记得您喜欢花和园艺。告诉我今天想做什么，我会陪您一起。" : "I remember that you enjoy flowers and gardening. Tell me what you would like to do, and I’ll help you find it."}
        </p>
        <button onClick={onTalk} className="mt-9 min-h-20 px-11 rounded-full bg-[#d97832] hover:bg-[#c96928] text-white text-2xl font-bold shadow-[0_14px_34px_rgba(190,99,35,.26)] inline-flex items-center gap-3 transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#f2c69f]">
          <MessageCircle className="w-8 h-8"/>{zh ? "和 Sunny 聊聊" : "Talk with Sunny"}
        </button>
        <a href={`${import.meta.env.BASE_URL}moment/index.html`} className="mt-4 min-h-16 px-9 rounded-full bg-[#335436] hover:bg-[#284629] text-white text-xl font-bold shadow-[0_12px_28px_rgba(51,84,54,.22)] inline-flex items-center gap-3 transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#dce6ce]">
          <Sun className="w-7 h-7"/>{zh ? "打开 MOMENT 湖边体验" : "Open the MOMENT experience"}
        </a>
        <p className="mt-8 text-base text-[#6c786f]">{zh ? "您可以说：我想看花、玩游戏、分享回忆，或者请求帮助。" : "You can ask to see flowers, play a game, share a memory, view your summary, or get help."}</p>
        <p className="mt-4 text-sm text-[#78847c]">Sunny is an AI companion, not a person. You are always in control.</p>
      </section>
    </main>
  </div>;
}
