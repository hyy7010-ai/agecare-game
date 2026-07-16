import { describe, expect, it } from "vitest";
import { buildDailySummary, buildFamilySummary, classifyResidentIntent, type CompanionSession } from "./residentCompanion";

describe("classifyResidentIntent", () => {
  it("routes flower requests to the curated gallery", () => {
    expect(classifyResidentIntent("I want to see flowers")).toMatchObject({ intent: "VIEW_IMAGES", topic: "flowers", requiresClarification: false });
  });
  it("supports Chinese flower requests", () => {
    expect(classifyResidentIntent("我想看看玫瑰花")).toMatchObject({ intent: "VIEW_IMAGES", topic: "flowers", language: "zh" });
  });
  it("prioritises an explicit safety concern", () => {
    expect(classifyResidentIntent("I fell and cannot get up").intent).toBe("SAFETY_CONCERN");
  });
  it("routes a flower game request to the native activity", () => {
    expect(classifyResidentIntent("I want to play something with flowers")).toMatchObject({ intent: "PLAY_ACTIVITY", topic: "flowers", contentType: "flower memory match" });
  });
  it("reports observable game facts without a clinical score", () => {
    const session: CompanionSession = { id: "s", residentId: "resident_001", startedAt: new Date().toISOString(), messages: [], activities: [{ id: "g", type: "memory_match", topic: "flowers", title: "Flower Memory Match", startedAt: new Date().toISOString(), durationSeconds: 90, completed: true, cardFlips: 12, hintsUsed: 1, replayed: true }] };
    expect(buildDailySummary(session).activities[0]).toMatchObject({ completed: true, cardFlips: 12, hintsUsed: 1, replayed: true });
    expect(buildFamilySummary(session)).toContain("completed the Flower Memory Match and replayed it");
    expect(buildFamilySummary(session)).not.toMatch(/cognition|attention|dementia/i);
  });
});
