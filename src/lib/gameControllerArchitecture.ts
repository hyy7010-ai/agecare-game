export type ControllerOrientation = "portrait" | "landscape";
export type ControllerConnectionState =
  | "not_connected"
  | "pairing"
  | "connected"
  | "reconnecting";

export interface ControllerAction {
  id: string;
  label: string;
  spokenLabel: string;
  icon: string;
  tone: "sage" | "sky" | "orange";
}

export interface CompanionGameDefinition {
  id: string;
  title: string;
  purpose: string;
  worldDescription: string;
  controllerActions: [ControllerAction] | [ControllerAction, ControllerAction];
}

export interface CompanionGameSession {
  sessionId: string;
  residentId: string;
  gameId: string;
  connectionState: ControllerConnectionState;
  orientation: ControllerOrientation;
  pairedAt?: string;
  lastControllerEventAt?: string;
}

export interface ControllerEvent {
  sessionId: string;
  actionId: string;
  sequence: number;
  occurredAt: string;
}

export const companionGameCatalogue: CompanionGameDefinition[] = [
  {
    id: "peaceful-fishing",
    title: "Peaceful Fishing",
    purpose: "Gentle shared interaction",
    worldDescription:
      "A calm animated lake with Sunny, fish, flowers and butterflies.",
    controllerActions: [
      { id: "cast", label: "CAST", spokenLabel: "Cast the line", icon: "🎣", tone: "sage" },
      { id: "reel", label: "REEL IN", spokenLabel: "Reel in gently", icon: "🐟", tone: "sky" },
    ],
  },
  {
    id: "flower-garden",
    title: "Flower Garden",
    purpose: "Simple garden participation",
    worldDescription:
      "Flowers bloom while Sunny guides the resident through the garden.",
    controllerActions: [
      { id: "plant", label: "PLANT FLOWER", spokenLabel: "Plant a flower", icon: "🌱", tone: "sage" },
      { id: "water", label: "WATER FLOWER", spokenLabel: "Water the flower", icon: "💧", tone: "sky" },
    ],
  },
  {
    id: "bubble-activity",
    title: "Floating Bubbles",
    purpose: "Relaxed one-button participation",
    worldDescription: "Large bubbles drift slowly across the shared display.",
    controllerActions: [
      { id: "pop", label: "POP BUBBLES", spokenLabel: "Pop the bubbles", icon: "🫧", tone: "sky" },
    ],
  },
  {
    id: "sunny-adventure",
    title: "Sunny Adventure",
    purpose: "Companionship and gentle participation",
    worldDescription: "Sunny walks slowly through a warm garden world.",
    controllerActions: [
      { id: "forward", label: "GO FORWARD", spokenLabel: "Go forward", icon: "👣", tone: "sage" },
      { id: "wave", label: "WAVE TO SUNNY", spokenLabel: "Wave to Sunny", icon: "👋", tone: "orange" },
    ],
  },
];

export const controllerAccessibilityRules = {
  maximumActions: 2,
  minimumTouchTargetPx: 96,
  supportsOneFinger: true,
  supportedOrientations: ["portrait", "landscape"] as ControllerOrientation[],
  rawMotionRequired: false,
  importantInformationUsesColourOnly: false,
} as const;
