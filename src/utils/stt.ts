// Browser SpeechRecognition types (not in standard TS lib)
type SpeechRecognitionCtor = new () => SpeechRecognition;

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
}

function getRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  return (
    (window as unknown as Record<string, unknown>).SpeechRecognition as SpeechRecognitionCtor ||
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition as SpeechRecognitionCtor ||
    null
  );
}

export function isSpeechSupported(): boolean {
  return getRecognition() !== null;
}

export function startListening(
  onInterim: (text: string) => void,
  onFinal: (text: string) => void,
  onEnd: () => void
): () => void {
  const Ctor = getRecognition();
  if (!Ctor) { onEnd(); return () => {}; }

  const recognition = new Ctor();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = "en-AU";

  recognition.onresult = (e: SpeechRecognitionEvent) => {
    let interim = "";
    let final = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) final += t;
      else interim += t;
    }
    if (final) onFinal(final);
    else if (interim) onInterim(interim);
  };

  recognition.onend = onEnd;
  recognition.onerror = onEnd;
  recognition.start();

  return () => recognition.stop();
}
