"use client";

import { useState, useEffect, useRef } from "react";
import { ChatSession } from "@/hooks/useChat";

interface Props {
  sessions: ChatSession[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

export default function SearchModal({ sessions, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const q = query.toLowerCase().trim();
  const results = q
    ? sessions.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.messages.some(m => m.text.toLowerCase().includes(q))
      )
    : sessions;

  const snippet = (session: ChatSession) => {
    if (!q) return null;
    const hit = session.messages.find(m => m.text.toLowerCase().includes(q));
    if (!hit) return null;
    const idx = hit.text.toLowerCase().indexOf(q);
    const start = Math.max(0, idx - 30);
    return "…" + hit.text.slice(start, idx + 60) + "…";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search chats…"
            className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600 text-xs">
              Clear
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">No chats found</p>
          ) : (
            results.map(s => (
              <button
                key={s.id}
                onClick={() => onSelect(s.id)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{s.title}</p>
                {snippet(s) && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{snippet(s)}</p>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
