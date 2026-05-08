let pendingOnEnd: (() => void) | null = null;
let keepAlive: ReturnType<typeof setInterval> | null = null;

function clearKeepAlive() {
  if (keepAlive !== null) {
    clearInterval(keepAlive);
    keepAlive = null;
  }
}

function getPreferredVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Google") ||
          v.name.includes("Natural") ||
          v.name.includes("Enhanced") ||
          v.name.includes("Premium"))
    ) ||
    voices.find((v) => v.lang === "en-AU") ||
    voices.find((v) => v.lang.startsWith("en")) ||
    null
  );
}

function startUtterance(text: string, onEnd?: () => void) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;

  const voice = getPreferredVoice();
  if (voice) utterance.voice = voice;

  utterance.onend = () => {
    clearKeepAlive();
    const cb = pendingOnEnd;
    pendingOnEnd = null;
    cb?.();
  };

  utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
    // 'canceled' fires when we call cancel() intentionally — ignore it
    if (e.error === "canceled") return;
    clearKeepAlive();
    const cb = pendingOnEnd;
    pendingOnEnd = null;
    cb?.();
  };

  pendingOnEnd = onEnd ?? null;
  window.speechSynthesis.speak(utterance);

  // Chrome bug: speechSynthesis silently stops after ~15s — keepalive via pause/resume
  keepAlive = setInterval(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    } else {
      clearKeepAlive();
    }
  }, 10000);
}

export function speak(text: string, onEnd?: () => void): void {
  if (!("speechSynthesis" in window)) return;

  // Cancel current speech without triggering the previous onEnd callback
  stopSpeaking();

  if (window.speechSynthesis.getVoices().length > 0) {
    startUtterance(text, onEnd);
  } else {
    window.speechSynthesis.addEventListener(
      "voiceschanged",
      () => startUtterance(text, onEnd),
      { once: true }
    );
  }
}

export function stopSpeaking(): void {
  clearKeepAlive();
  pendingOnEnd = null; // clear before cancel so the 'canceled' error path doesn't fire it
  window.speechSynthesis.cancel();
}

export function isSpeaking(): boolean {
  return "speechSynthesis" in window && window.speechSynthesis.speaking;
}
