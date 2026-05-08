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

  useEffect(() => { currentIdRef.current = currentId; }, [currentId]);

  // Persist to localStorage whenever sessions change (after initial load)
  const initialised = useRef(false);
  useEffect(() => {
    if (!initialised.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  // Load from localStorage on mount
  useEffect(() => {
    let list: ChatSession[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) list = JSON.parse(raw) as ChatSession[];
    } catch { /* ignore */ }

    if (list.length === 0) list = [makeSession()];
    initialised.current = true;
    setSessions(list);
    setCurrentId(list[0].id);
  }, []);

  const startNewChat = useCallback(() => {
    const s = makeSession();
    apiSessionRef.current = uuidv4();
    setSessions(prev => [s, ...prev]);
    setCurrentId(s.id);
  }, []);

  const loadSession = useCallback((id: string) => {
    setCurrentId(id);
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

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: apiSessionRef.current, message: text.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const tutorMsg: Message = { id: uuidv4(), role: "tutor", text: data.response };
      setSessions(prev =>
        prev.map(s => s.id !== sid ? s : { ...s, messages: [...s.messages, tutorMsg] })
      );
    } catch {
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
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const messages = sessions.find(s => s.id === currentId)?.messages ?? [];

  return { sessions, currentId, messages, isLoading, sendMessage, startNewChat, loadSession };
}
