import { describe, expect, it } from "vitest";
import {
  companionGameCatalogue,
  controllerAccessibilityRules,
} from "./gameControllerArchitecture";

describe("resident phone-controller architecture", () => {
  it("limits every controller to one or two actions", () => {
    for (const game of companionGameCatalogue) {
      expect(game.controllerActions.length).toBeGreaterThanOrEqual(1);
      expect(game.controllerActions.length).toBeLessThanOrEqual(
        controllerAccessibilityRules.maximumActions,
      );
    }
  });

  it("requires senior-friendly touch targets and both orientations", () => {
    expect(controllerAccessibilityRules.minimumTouchTargetPx).toBeGreaterThanOrEqual(96);
    expect(controllerAccessibilityRules.supportedOrientations).toEqual([
      "portrait",
      "landscape",
    ]);
    expect(controllerAccessibilityRules.supportsOneFinger).toBe(true);
  });

  it("does not require device motion or colour-only instructions", () => {
    expect(controllerAccessibilityRules.rawMotionRequired).toBe(false);
    expect(controllerAccessibilityRules.importantInformationUsesColourOnly).toBe(false);
  });
});
