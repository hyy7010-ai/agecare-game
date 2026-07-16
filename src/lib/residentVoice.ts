export function supportsSpeechRecognition(scope: typeof globalThis = globalThis) {
  return Boolean((scope as any).SpeechRecognition || (scope as any).webkitSpeechRecognition);
}

export function supportsSpeechSynthesis(scope: typeof globalThis = globalThis) {
  return Boolean((scope as any).speechSynthesis && (scope as any).SpeechSynthesisUtterance);
}

export function speechRate(slower: boolean) { return slower ? 0.72 : 0.95; }
