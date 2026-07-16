import { describe, expect, it } from "vitest";
import { speechRate, supportsSpeechRecognition, supportsSpeechSynthesis } from "./residentVoice";

describe("resident voice fallback", () => {
  it("reports unsupported speech APIs safely", () => {
    expect(supportsSpeechRecognition({} as typeof globalThis)).toBe(false);
    expect(supportsSpeechSynthesis({} as typeof globalThis)).toBe(false);
  });
  it("uses a slower, non-clinical playback rate", () => expect(speechRate(true)).toBeLessThan(speechRate(false)));
});
