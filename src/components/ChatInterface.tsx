"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useChat, Message } from "@/hooks/useChat";
import { useTheme } from "@/hooks/useTheme";
import { speak, stopSpeaking } from "@/utils/tts";
import { startListening, isSpeechSupported } from "@/utils/stt";
import { STRANDS, detectStrand, getStrand } from "@/utils/strands";
import Sidebar from "@/components/Sidebar";
import SearchModal from "@/components/SearchModal";

// ─── Icons ────────────────────────────────────────────────────────────────────

function SendIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  );
}

function SpeakerOnIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
      <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
    </svg>
  );
}

function SpeakerOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM17.78 9.22a.75.75 0 10-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 001.06 1.06L19.5 13.06l1.72 1.72a.75.75 0 101.06-1.06L20.56 12l1.72-1.72a.75.75 0 00-1.06-1.06L19.5 10.94l-1.72-1.72z" />
    </svg>
  );
}

function MicIcon({ listening }: { listening: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
      className={`w-5 h-5 transition-colors ${listening ? "text-white" : ""}`}>
      <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
      <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.041h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.041a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
    </svg>
  );
}

// ─── Lightweight markdown renderer ───────────────────────────────────────────

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i} className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
    return part;
  });
}

function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let ulBuf: string[] = [];
  let olBuf: string[] = [];
  let key = 0;

  const flushUl = () => {
    if (!ulBuf.length) return;
    nodes.push(
      <ul key={key++} className="list-disc pl-5 my-1.5 space-y-0.5">
        {ulBuf.map((t, i) => <li key={i} className="text-sm leading-relaxed">{renderInline(t)}</li>)}
      </ul>
    );
    ulBuf = [];
  };
  const flushOl = () => {
    if (!olBuf.length) return;
    nodes.push(
      <ol key={key++} className="list-decimal pl-5 my-1.5 space-y-0.5">
        {olBuf.map((t, i) => <li key={i} className="text-sm leading-relaxed">{renderInline(t)}</li>)}
      </ol>
    );
    olBuf = [];
  };

  for (const line of lines) {
    if (/^#{1,3}\s/.test(line)) {
      flushUl(); flushOl();
      nodes.push(<p key={key++} className="font-semibold text-sm mt-2 mb-0.5 text-gray-900 dark:text-gray-100">{renderInline(line.replace(/^#{1,3}\s/, ""))}</p>);
    } else if (/^[-*]\s/.test(line)) {
      flushOl();
      ulBuf.push(line.replace(/^[-*]\s/, ""));
    } else if (/^\d+\.\s/.test(line)) {
      flushUl();
      olBuf.push(line.replace(/^\d+\.\s/, ""));
    } else if (line.trim() === "") {
      flushUl(); flushOl();
    } else {
      flushUl(); flushOl();
      nodes.push(<p key={key++} className="text-sm leading-relaxed">{renderInline(line)}</p>);
    }
  }
  flushUl(); flushOl();
  return <div className="space-y-1">{nodes}</div>;
}

// ─── Voxxi thinking animation ─────────────────────────────────────────────────

function ThinkingBubble() {
  return (
    <div className="voxii-thinking-bubble">
      {/* Rotating arc + V icon */}
      <div className="relative flex-shrink-0 w-10 h-10">
        {/* Spinning gradient arc */}
        <svg
          viewBox="0 0 40 40"
          fill="none"
          className="absolute inset-0 w-full h-full"
          style={{ animation: "voxxi-arc-spin 1.6s linear infinite" }}
        >
          <defs>
            <linearGradient id="voxxi-arc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#2563EB" stopOpacity="0" />
              <stop offset="35%"  stopColor="#3B82F6" stopOpacity="0.9" />
              <stop offset="65%"  stopColor="#06B6D4" stopOpacity="1" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Partial arc — ~120° of the circle */}
          <circle
            cx="20" cy="20" r="17"
            stroke="url(#voxxi-arc-grad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="36 71"
          />
        </svg>

        {/* Central favicon with pulse */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ animation: "voxxi-v-pulse 2s ease-in-out infinite" }}
        >
          <Image src="/voxii-favicon.png" alt="" width={22} height={22} className="select-none" />
        </div>
      </div>

      {/* Text + animated dots */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-gray-500 dark:text-gray-400 italic">
          Voxxi is thinking
        </span>
        <span className="flex items-end gap-0.5 pb-0.5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1 h-1 rounded-full bg-blue-400 inline-block"
              style={{ animation: `thinking-dot 1.4s ease-in-out ${i * 0.18}s infinite` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

// ─── Tutor bubble — paragraph-reveal + markdown ───────────────────────────────

function TutorBubble({ message, isNew, isActive, onPlay, onStop, strand }: {
  message: Message;
  isNew: boolean;
  isActive: boolean;
  onPlay: () => void;
  onStop: () => void;
  strand?: string | null;
}) {
  const paragraphs = message.text.split(/\n\n+/).filter(Boolean);
  const [visible, setVisible] = useState(isNew ? 1 : paragraphs.length);
  const animating = useRef(isNew);

  useEffect(() => {
    if (!animating.current) return;
    if (visible >= paragraphs.length) { animating.current = false; return; }
    const t = setTimeout(() => setVisible(v => v + 1), 380);
    return () => clearTimeout(t);
  }, [visible, paragraphs.length]);

  const isDone = visible >= paragraphs.length;
  const displayedText = paragraphs.slice(0, visible).join("\n\n");

  const strandInfo = strand ? getStrand(strand) : null;

  return (
    <div className="voxii-bubble-tutor">
      {strandInfo && (
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mb-2 font-medium ${strandInfo.badgeBg} ${strandInfo.badgeText}`}>
          {strandInfo.emoji} {strandInfo.id}
        </span>
      )}
      <MarkdownText text={displayedText} />

      {/* Typing indicator while revealing */}
      {!isDone && (
        <span className="flex gap-1 mt-2">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </span>
      )}

      {/* Read aloud button — only shown once fully revealed */}
      {isDone && (
        <button
          onClick={isActive ? onStop : onPlay}
          aria-label={isActive ? "Stop reading" : "Read this message"}
          className={`mt-2 flex items-center gap-1.5 text-xs transition-colors ${
            isActive ? "text-blue-500" : "text-gray-300 dark:text-gray-600 hover:text-blue-400"
          }`}
        >
          {isActive ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
              </svg>
              <span>Stop</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
              <span>Read aloud</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ─── User bubble ─────────────────────────────────────────────────────────────

function UserBubble({ message }: { message: Message }) {
  return (
    <div className="voxii-bubble-user">
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
    </div>
  );
}

// ─── Welcome screen — strand cards ───────────────────────────────────────────

function WelcomeScreen({ studentName, onSend }: { studentName: string; onSend: (t: string) => void }) {
  const [activeStrand, setActiveStrand] = useState<string | null>(null);
  const selected = STRANDS.find(s => s.id === activeStrand);

  return (
    <div className="flex flex-col max-w-2xl mx-auto px-4 pt-6 md:pt-10 pb-4">
      <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 font-light mb-0.5">
        Hello {studentName},
      </p>
      <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
        I am Voxxi your Year 9 Maths Tutor
      </h2>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
        Select a curriculum strand to explore topics, or ask me anything below.
      </p>

      {/* 6 strand cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
        {STRANDS.map(strand => (
          <button
            key={strand.id}
            onClick={() => setActiveStrand(activeStrand === strand.id ? null : strand.id)}
            className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
              activeStrand === strand.id
                ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-base">{strand.emoji}</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{strand.id}</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-snug">{strand.description}</p>
          </button>
        ))}
      </div>

      {/* Topic chips for selected strand */}
      {selected && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            {selected.emoji} {selected.id} — pick a topic to get started:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selected.topics.map(topic => (
              <button
                key={topic}
                onClick={() => onSend(topic)}
                className="px-3 py-1 rounded-full text-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-blue-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors shadow-sm"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {!activeStrand && (
        <p className="text-xs text-gray-400 dark:text-gray-600 italic">
          ↑ Click a strand to see Year 9 topics
        </p>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ChatInterface() {
  const { dark, toggle: toggleTheme } = useTheme();
  const { sessions, currentId, messages, isLoading, sendMessage, startNewChat, loadSession, deleteSession, cancelMessage } = useChat();

  const [studentName, setStudentName] = useState("Student");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");

  // Track the most recently received tutor message for paragraph-reveal
  const [latestTutorId, setLatestTutorId] = useState<string | null>(null);
  const wasLoading = useRef(false);

  useEffect(() => {
    if (wasLoading.current && !isLoading) {
      const last = messages[messages.length - 1];
      if (last?.role === "tutor") setLatestTutorId(last.id);
    }
    wasLoading.current = isLoading;
  }, [isLoading, messages]);

  // Reset when switching sessions
  useEffect(() => { setLatestTutorId(null); }, [currentId]);

  // TTS state
  const [readAloud, setReadAloud] = useState(false);
  const [activeMsgId, setActiveMsgId] = useState<string | null>(null);
  const lastSpokenId = useRef<string | null>(null);

  // STT state
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const interimRef = useRef("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("voxxi-student-name");
    if (stored) setStudentName(stored);
    const tts = localStorage.getItem("voxxi-read-aloud");
    if (tts === "true") setReadAloud(true);
    setSpeechSupported(isSpeechSupported());
  }, []);

  const toggleMic = useCallback(() => {
    if (listening) {
      stopListeningRef.current?.();
      stopListeningRef.current = null;
      setListening(false);
      interimRef.current = "";
      return;
    }

    setListening(true);
    interimRef.current = input;

    stopListeningRef.current = startListening(
      (interim) => {
        setInput(interimRef.current + interim);
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
        }
      },
      (final) => {
        const next = interimRef.current + final;
        interimRef.current = next;
        setInput(next);
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
        }
      },
      () => {
        setListening(false);
        stopListeningRef.current = null;
      }
    );
  }, [listening, input]);

  const toggleReadAloud = () => {
    const next = !readAloud;
    setReadAloud(next);
    localStorage.setItem("voxxi-read-aloud", String(next));
    if (!next) {
      stopSpeaking();
      setActiveMsgId(null);
    }
  };

  // Auto-read new tutor messages when readAloud is on
  useEffect(() => {
    if (!readAloud) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "tutor") return;
    if (last.id === lastSpokenId.current) return;
    lastSpokenId.current = last.id;
    setActiveMsgId(last.id);
    speak(last.text, () => setActiveMsgId(null));
  }, [messages, readAloud]);

  const handlePlay = useCallback((msg: Message) => {
    setActiveMsgId(msg.id);
    lastSpokenId.current = msg.id;
    speak(msg.text, () => setActiveMsgId(null));
  }, []);

  const handleStop = useCallback(() => {
    stopSpeaking();
    setActiveMsgId(null);
  }, []);

  const updateStudentName = (name: string) => {
    setStudentName(name);
    localStorage.setItem("voxxi-student-name", name);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await sendMessage(text);
  }, [input, isLoading, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const isEmpty = messages.length === 0 && !isLoading;

  return (
    <div className="flex h-full bg-[#f8f9fa] dark:bg-gray-950">
      {searchOpen && (
        <SearchModal
          sessions={sessions}
          onSelect={id => { loadSession(id); setSearchOpen(false); }}
          onClose={() => setSearchOpen(false)}
        />
      )}

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        sessions={sessions}
        currentId={currentId}
        studentName={studentName}
        onUpdateName={updateStudentName}
        onNewChat={() => { startNewChat(); setSidebarOpen(false); }}
        onLoadSession={id => { loadSession(id); setSidebarOpen(false); }}
        onDeleteSession={id => deleteSession(id)}
        onOpenSearch={() => { setSearchOpen(true); setSidebarOpen(false); }}
        dark={dark}
        onToggleTheme={toggleTheme}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* ── Right: chat area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Voxxi Maths Tutor</span>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto px-3 md:px-4 py-4 md:py-6">
          {isEmpty ? (
            <WelcomeScreen studentName={studentName} onSend={sendMessage} />
          ) : (
            <div className="max-w-2xl mx-auto flex flex-col">
              {messages.map((msg, idx) => {
                if (msg.role === "user") return <UserBubble key={msg.id} message={msg} />;
                const prevUser = messages.slice(0, idx).reverse().find(m => m.role === "user");
                const strand = prevUser ? detectStrand(prevUser.text) : null;
                return (
                  <TutorBubble
                    key={msg.id}
                    message={msg}
                    isNew={msg.id === latestTutorId}
                    isActive={activeMsgId === msg.id}
                    onPlay={() => handlePlay(msg)}
                    onStop={handleStop}
                    strand={strand}
                  />
                );
              })}
              {isLoading && <ThinkingBubble />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* ── Input bar ── */}
        <div className="px-3 md:px-4 py-3 md:py-4 bg-[#f8f9fa] dark:bg-gray-950">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-end gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl px-3 md:px-4 py-2.5 md:py-3 shadow-sm focus-within:border-blue-400 focus-within:shadow-md transition-all">

              {/* Read Aloud toggle */}
              <button
                onClick={toggleReadAloud}
                title={readAloud ? "Read Aloud: ON — click to turn off" : "Read Aloud: OFF — click to turn on"}
                className={`flex-shrink-0 flex items-center gap-1.5 px-2 md:px-3 py-2 rounded-full text-xs font-medium transition-all ${
                  readAloud
                    ? "bg-blue-500 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {readAloud ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
                <span className="hidden sm:inline">{readAloud ? "Read Aloud: ON" : "Read Aloud"}</span>
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask Voxxi a maths question…"
                className="flex-1 resize-none bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none leading-relaxed max-h-40 py-1"
              />

              {speechSupported && (
                <button
                  onClick={toggleMic}
                  title={listening ? "Stop listening" : "Speak your question"}
                  className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    listening
                      ? "bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-md shadow-red-200 dark:shadow-red-900"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                  aria-label={listening ? "Stop listening" : "Speak your question"}
                >
                  <MicIcon listening={listening} />
                </button>
              )}

              {isLoading ? (
                <button
                  onClick={cancelMessage}
                  className="flex-shrink-0 w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors shadow-sm"
                  aria-label="Stop"
                  title="Stop response"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim()}
                  className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors"
                  aria-label="Send"
                >
                  <SendIcon />
                </button>
              )}
            </div>

            <p className="text-center text-xs text-gray-400 mt-2 hidden sm:block">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
