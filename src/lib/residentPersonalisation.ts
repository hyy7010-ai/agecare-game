import type { CompanionSession } from "./residentCompanion";

export interface ResidentMemoryJournal {
  id: string;
  title: string;
  body: string;
  topic: string;
  createdAt: string;
  sharedWithFamily: boolean;
}

export interface ResidentPreference {
  residentId: string;
  favouriteTopics: string[];
  favouriteActivities: string[];
  preferredLanguage: "en" | "zh";
  explicitLikes: string[];
  explicitDislikes: string[];
  savedMemories: ResidentMemoryJournal[];
}

export interface ResidentRecommendation { id: string; title: string; reason: string; action: "flowers" | "game" | "memory" | "chat"; }

const KEY = "sunrise_resident_preferences_v1";
export const defaultPreference = (language: "en" | "zh" = "en"): ResidentPreference => ({ residentId: "resident_001", favouriteTopics: ["flowers", "gardening"], favouriteActivities: [], preferredLanguage: language, explicitLikes: [], explicitDislikes: [], savedMemories: [] });
export function loadPreference(storage: Pick<Storage, "getItem"> = localStorage): ResidentPreference { try { return { ...defaultPreference(), ...JSON.parse(storage.getItem(KEY) || "null") }; } catch { return defaultPreference(); } }
export function savePreference(profile: ResidentPreference, storage: Pick<Storage, "setItem"> = localStorage) { storage.setItem(KEY, JSON.stringify(profile)); }
const unique = (items: string[]) => [...new Set(items.filter(Boolean))];

export function updatePreferenceFromSession(profile: ResidentPreference, session: CompanionSession): ResidentPreference {
  const topics = session.messages.map(message => message.intent?.topic).filter(topic => topic && !["general", "assistance"].includes(topic)) as string[];
  const activities = session.activities.filter(activity => activity.completed).map(activity => activity.title);
  const residentText = session.messages.filter(message => message.role === "resident").map(message => message.text);
  const likes = residentText.filter(text => /\b(like|love|enjoy)\b|喜欢|爱/i.test(text));
  const dislikes = residentText.filter(text => /\b(dislike|do not like|don't like)\b|不喜欢/i.test(text));
  return { ...profile, favouriteTopics: unique([...profile.favouriteTopics, ...topics]), favouriteActivities: unique([...profile.favouriteActivities, ...activities]), explicitLikes: unique([...profile.explicitLikes, ...likes]), explicitDislikes: unique([...profile.explicitDislikes, ...dislikes]) };
}

export function generateStory(responses: string[], topic: string, language: "en" | "zh"): ResidentMemoryJournal {
  const details = responses.map(value => value.trim()).filter(Boolean).slice(-3).join(" ");
  const fallback = language === "zh" ? "Mary 分享了一段珍贵的回忆。" : "Mary shared a meaningful memory with Sunny.";
  return { id: crypto.randomUUID(), title: language === "zh" ? `Mary 的${topic}回忆` : `Mary's ${topic} Memory`, body: details ? (language === "zh" ? `今天，Mary 分享道：${details}` : `Today, Mary shared: ${details}`) : fallback, topic, createdAt: new Date().toISOString(), sharedWithFamily: false };
}

export function buildRecommendations(profile: ResidentPreference): ResidentRecommendation[] {
  const flowers = profile.favouriteTopics.some(topic => /flower|garden/i.test(topic));
  return [
    flowers ? { id: "flowers", title: "Look at Australian flower gardens", reason: "Because you enjoy flowers and gardening.", action: "flowers" } : { id: "chat", title: "Talk with Sunny", reason: "Choose any topic you enjoy.", action: "chat" },
    { id: "game", title: "Play Flower Memory Match", reason: "You may enjoy this familiar flower activity.", action: "game" },
    { id: "memory", title: "Share a childhood memory", reason: "Save it only if you choose.", action: "memory" }
  ];
}

export function buildFamilyWeeklySummary(profile: ResidentPreference, session: CompanionSession) {
  const shared = profile.savedMemories.filter(memory => memory.sharedWithFamily);
  const games = session.activities.filter(activity => activity.type === "memory_match");
  const minutes = Math.max(1, Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000));
  return `Mary's Weekly Sunrise Summary\n\nThis week Mary:\n- ${games.length ? `Played Flower Memory Match ${games.length} time${games.length === 1 ? "" : "s"}.` : "Chose activities with Sunny."}\n- ${shared.length ? `Shared ${shared.map(memory => memory.title).join(", ")} with permission.` : "Did not share a memory with family."}\n- Enjoyed topics including ${profile.favouriteTopics.slice(0, 3).join(", ") || "activities she selected"}.\n- Spent about ${minutes} minutes interacting with Sunny.\n\nSuggested conversation topic: Ask Mary about ${shared[0]?.topic || profile.favouriteTopics[0] || "a favourite memory"}.`;
}
