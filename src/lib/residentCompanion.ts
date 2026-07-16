export type ResidentIntent =
  | "CHAT" | "WATCH_VIDEO" | "VIEW_IMAGES" | "LISTEN_TO_MUSIC"
  | "PLAY_ACTIVITY" | "SHARE_MEMORY" | "LEARN_SOMETHING"
  | "CONTACT_FAMILY" | "REQUEST_STAFF_HELP" | "GENERAL_SEARCH"
  | "UNKNOWN" | "SAFETY_CONCERN";

export interface IntentResult {
  intent: ResidentIntent;
  topic: string;
  contentType: string;
  language: "en" | "zh";
  confidence: number;
  requiresClarification: boolean;
}

export interface CompanionActivity {
  id: string;
  type: "images" | "conversation" | "memory_match";
  topic: string;
  title: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  completed: boolean;
  cardFlips?: number;
  hintsUsed?: number;
  replayed?: boolean;
}

export interface CompanionMessage {
  id: string;
  role: "resident" | "assistant";
  text: string;
  createdAt: string;
  intent?: IntentResult;
}

export interface CompanionSession {
  id: string;
  residentId: string;
  startedAt: string;
  messages: CompanionMessage[];
  activities: CompanionActivity[];
}

const includesAny = (value: string, words: string[]) => words.some(word => value.includes(word));

export function classifyResidentIntent(input: string): IntentResult {
  const text = input.trim().toLowerCase();
  const language: "en" | "zh" = /[\u3400-\u9fff]/.test(text) ? "zh" : "en";
  const flower = includesAny(text, ["flower", "flowers", "rose", "garden", "花", "玫瑰", "花园"]);
  const safety = includesAny(text, [
    "i fell", "cannot get up", "can't get up", "cannot breathe", "can't breathe",
    "hurt myself", "in pain", "get a nurse", "need a nurse", "i am lost",
    "我摔倒", "起不来", "不能呼吸", "无法呼吸", "伤害自己", "护士", "我迷路"
  ]);
  if (safety) return { intent: "SAFETY_CONCERN", topic: "assistance", contentType: "human assistance", language, confidence: 0.99, requiresClarification: false };
  if (includesAny(text, ["help me", "staff help", "get staff", "请帮忙", "找工作人员"])) return { intent: "REQUEST_STAFF_HELP", topic: "assistance", contentType: "human assistance", language, confidence: 0.96, requiresClarification: false };
  if (includesAny(text, ["daughter", "son", "family", "call sarah", "家人", "女儿", "儿子"])) return { intent: "CONTACT_FAMILY", topic: "family", contentType: "contact request", language, confidence: 0.9, requiresClarification: false };
  if (includesAny(text, ["remember", "memory", "childhood", "used to", "回忆", "小时候", "以前"])) return { intent: "SHARE_MEMORY", topic: flower ? "gardening" : "memory", contentType: "conversation", language, confidence: 0.88, requiresClarification: false };
  if (includesAny(text, ["music", "song", "listen", "音乐", "歌曲", "听歌"])) return { intent: "LISTEN_TO_MUSIC", topic: "music", contentType: "audio", language, confidence: 0.91, requiresClarification: !text.includes("old") && !text.includes("老歌") };
  if (includesAny(text, ["video", "watch", "football", "视频", "观看", "足球"])) return { intent: "WATCH_VIDEO", topic: flower ? "flowers" : (text.includes("football") || text.includes("足球") ? "football" : "general"), contentType: "curated video", language, confidence: 0.9, requiresClarification: !flower };
  const play = includesAny(text, ["game", "activity", "play", "match", "游戏", "活动", "配对"]);
  if (play) return { intent: "PLAY_ACTIVITY", topic: flower ? "flowers" : "activity", contentType: flower ? "flower memory match" : "native activity", language, confidence: flower ? 0.96 : 0.84, requiresClarification: !flower };
  if (flower || includesAny(text, ["show me", "look at", "photo", "picture", "看看", "照片", "图片"])) return { intent: "VIEW_IMAGES", topic: flower ? "flowers" : "general", contentType: "curated image gallery", language, confidence: flower ? 0.95 : 0.72, requiresClarification: !flower };
  if (text.length < 2) return { intent: "UNKNOWN", topic: "", contentType: "conversation", language, confidence: 0.2, requiresClarification: true };
  return { intent: "CHAT", topic: flower ? "flowers" : "general", contentType: "conversation", language, confidence: 0.68, requiresClarification: false };
}

const STORAGE_KEY = "sunrise_resident_companion_v1";

export function createSession(): CompanionSession {
  return { id: crypto.randomUUID(), residentId: "resident_001", startedAt: new Date().toISOString(), messages: [], activities: [] };
}

export function loadSession(): CompanionSession | null {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; }
}

export function saveSession(session: CompanionSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent("sunrise-resident-summary-updated"));
}

export function buildDailySummary(session: CompanionSession) {
  const topics = [...new Set([
    ...session.messages.map(message => message.intent?.topic).filter(Boolean),
    ...session.activities.map(activity => activity.topic)
  ])] as string[];
  return {
    residentId: session.residentId,
    date: new Date().toISOString().slice(0, 10),
    activities: session.activities.map(activity => ({
      type: activity.type, topic: activity.topic,
      durationMinutes: Math.max(1, Math.round((activity.durationSeconds || 0) / 60)),
      completed: activity.completed,
      ...(activity.type === "memory_match" ? { cardFlips: activity.cardFlips || 0, hintsUsed: activity.hintsUsed || 0, replayed: Boolean(activity.replayed) } : {})
    })),
    conversationTopics: topics,
    explicitFeedback: session.messages.find(message => /enjoy|like|喜欢|开心/i.test(message.text))?.text || "Not recorded",
    followUpSuggestion: topics.includes("flowers") ? "Offer another gardening activity." : "Ask Mary what she would enjoy next."
  };
}

export function buildFamilySummary(session: CompanionSession) {
  const daily = buildDailySummary(session);
  const minutes = daily.activities.reduce((sum, activity) => sum + activity.durationMinutes, 0);
  const flowerInterest = daily.conversationTopics.includes("flowers");
  const games = daily.activities.filter(activity => activity.type === "memory_match");
  const gameFact = games.length ? ` She ${games.some(game => game.completed) ? "completed" : "started"} the Flower Memory Match${games.some(game => game.replayed) ? " and replayed it" : ""}.` : "";
  return `Mary explored ${flowerInterest ? "flowers and gardening" : "activities she selected"} today. She spent about ${minutes} minute${minutes === 1 ? "" : "s"} with Sunrise Companion.${gameFact} A conversation you may enjoy having with Mary: “${flowerInterest ? "Which flowers did you grow when you were younger?" : "What would you like to explore tomorrow?"}”`;
}
