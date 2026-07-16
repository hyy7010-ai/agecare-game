import { describe, expect, it } from "vitest";
import { buildFamilyWeeklySummary, buildRecommendations, defaultPreference, generateStory, loadPreference, savePreference, updatePreferenceFromSession } from "./residentPersonalisation";
import type { CompanionSession } from "./residentCompanion";

const session: CompanionSession = { id: "s", residentId: "resident_001", startedAt: new Date().toISOString(), messages: [{ id: "m", role: "resident", text: "I love roses", createdAt: new Date().toISOString(), intent: { intent: "CHAT", topic: "flowers", contentType: "conversation", language: "en", confidence: .9, requiresClarification: false } }], activities: [] };
describe("resident personalisation", () => {
  it("generates an editable, unshared story", () => expect(generateStory(["I grew red roses."], "garden", "en")).toMatchObject({ sharedWithFamily: false, topic: "garden" }));
  it("updates only explicit non-clinical preferences", () => { const result = updatePreferenceFromSession(defaultPreference(), session); expect(result.favouriteTopics).toContain("flowers"); expect(result.explicitLikes).toContain("I love roses"); expect(JSON.stringify(result)).not.toMatch(/diagnosis|score/i); });
  it("builds optional recommendations", () => expect(buildRecommendations(defaultPreference()).map(item => item.action)).toEqual(["flowers", "game", "memory"]));
  it("includes only consented memories in the family summary", () => { const profile = defaultPreference(); profile.savedMemories = [{ ...generateStory(["Roses"], "garden", "en"), sharedWithFamily: true }]; expect(buildFamilyWeeklySummary(profile, session)).toContain("with permission"); });
  it("falls back to local storage", () => { let value = ""; const storage = { getItem: () => value, setItem: (_: string, next: string) => { value = next; } }; savePreference(defaultPreference("zh"), storage); expect(loadPreference(storage).preferredLanguage).toBe("zh"); });
});
