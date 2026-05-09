"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

export type Role = "user" | "tutor";

export interface Message {
  id: string;
  role: Role;
  text: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

const STORAGE_KEY = "voxxi-sessions";

function makeSession(title = "New Chat"): ChatSession {
  return { id: uuidv4(), title, messages: [], createdAt: Date.now() };
}

export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentId, setCurrentId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const currentIdRef = useRef("");
  const isLoadingRef = useRef(false);
  const apiSessionRef = useRef(uuidv4());
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { currentIdRef.current = currentId; }, [currentId]);

  const initialised = useRef(false);
  useEffect(() => {
    if (!initialised.current) return;
    // Only persist sessions that have at least one message
    const toSave = sessions.filter(s => s.messages.length > 0);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [sessions]);

  // On mount: load history, strip empty sessions, rewrite localStorage, then open a fresh chat
  useEffect(() => {
    let history: ChatSession[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const all = JSON.parse(raw) as ChatSession[];
        history = all.filter(s => s.messages.length > 0);
        // Rewrite immediately so stale empty sessions are gone
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      }
    } catch { /* ignore */ }

    const fresh = makeSession();
    initialised.current = true;
    setSessions([fresh, ...history]);
    setCurrentId(fresh.id);
  }, []);

  const startNewChat = useCallback(() => {
    const s = makeSession();
    apiSessionRef.current = uuidv4();
    // Remove any existing empty sessions before adding the new one
    setSessions(prev => [s, ...prev.filter(p => p.messages.length > 0)]);
    setCurrentId(s.id);
  }, []);

  const loadSession = useCallback((id: string) => {
    setCurrentId(id);
  }, []);

  const cancelMessage = useCallback(() => {
    if (!isLoadingRef.current) return;
    abortRef.current?.abort();
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoadingRef.current) return;
    const sid = currentIdRef.current;

    const userMsg: Message = { id: uuidv4(), role: "user", text: text.trim() };
    setSessions(prev =>
      prev.map(s => {
        if (s.id !== sid) return s;
        return {
          ...s,
          title: s.messages.length === 0 ? text.slice(0, 55) : s.title,
          messages: [...s.messages, userMsg],
        };
      })
    );

    isLoadingRef.current = true;
    setIsLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: apiSessionRef.current, message: text.trim() }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const tutorMsg: Message = { id: uuidv4(), role: "tutor", text: data.response };
      setSessions(prev =>
        prev.map(s => s.id !== sid ? s : { ...s, messages: [...s.messages, tutorMsg] })
      );
    } catch (err) {
      // Aborted by user — remove the user message that was added
      if (err instanceof Error && err.name === "AbortError") {
        setSessions(prev =>
          prev.map(s =>
            s.id !== sid ? s : {
              ...s,
              title: s.messages.length === 1 ? "New Chat" : s.title,
              messages: s.messages.filter(m => m.id !== userMsg.id),
            }
          )
        );
      } else {
        setSessions(prev =>
          prev.map(s =>
            s.id !== sid ? s : {
              ...s,
              messages: [
                ...s.messages,
                { id: uuidv4(), role: "tutor" as Role, text: "Sorry, I couldn't reach the server. Please try again." },
              ],
            }
          )
        );
      }
    } finally {
      abortRef.current = null;
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const messages = sessions.find(s => s.id === currentId)?.messages ?? [];

  return { sessions, currentId, messages, isLoading, sendMessage, startNewChat, loadSession, cancelMessage };
}
