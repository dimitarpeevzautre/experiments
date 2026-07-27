import * as Speech from 'expo-speech';

/**
 * Thin wrapper over expo-speech so the rest of the app never touches the TTS
 * API directly. When professionally recorded audio exists, this becomes an
 * expo-audio player with the same interface (and the same interface again
 * backs the CarPlay / Android Auto media session — see docs/ARCHITECTURE.md).
 */

export interface SpeakHandle {
  stop: () => void;
}

export function speak(text: string, onDone?: () => void): SpeakHandle {
  Speech.speak(text, {
    language: 'en-US',
    rate: 0.98,
    onDone,
    onStopped: onDone,
    onError: onDone,
  });
  return { stop: () => Speech.stop() };
}

export function stopSpeaking(): void {
  Speech.stop();
}

export async function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}
