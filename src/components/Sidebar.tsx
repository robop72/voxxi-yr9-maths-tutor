"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChatSession } from "@/hooks/useChat";

interface Props {
  sessions: ChatSession[];
  currentId: string;
  studentName: string;
  onUpdateName: (name: string) => void;
  onNewChat: () => void;
  onLoadSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onOpenSearch: () => void;
  dark: boolean;
  onToggleTheme: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function timeLabel(ts: number) {
  const now = Date.now();
  const diff = now - ts;
  const day = 86400000;
  if (diff < day) return "Today";
  if (diff < 2 * day) return "Yesterday";
  if (diff < 7 * day) return "This week";
  return "Earlier";
}

export default function Sidebar({
  sessions, currentId, studentName, onUpdateName,
  onNewChat, onLoadSession, onDeleteSession, onOpenSearch, dark, onToggleTheme,
  mobileOpen, onMobileClose,
}: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [nameInput, setNameInput] = useState(studentName);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleNameSave = () => {
    const trimmed = nameInput.trim() || "Student";
    setNameInput(trimmed);
    onUpdateName(trimmed);
  };

  // Group sessions by time — only show sessions that have at least one message
  const groups: Record<string, ChatSession[]> = {};
  for (const s of sessions.filter(s => s.messages.length > 0)) {
    const label = timeLabel(s.createdAt);
    if (!groups[label]) groups[label] = [];
    groups[label].push(s);
  }
  const groupOrder = ["Today", "Yesterday", "This week", "Earlier"];

  return (
    <aside ref={sidebarRef} className={`
      flex-shrink-0 flex flex-col h-full w-64 bg-[#f0f4f9] dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
      fixed md:relative inset-y-0 left-0 z-40 transition-transform duration-300
      ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
    `}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        {/* Logo */}
        <div className="flex items-center">
          <Image
            src="/voxii-logo.png"
            alt="Voxii AI"
            width={90}
            height={28}
            className="object-contain"
            priority
          />
        </div>
        {/* Search icon + mobile close */}
        <div className="flex items-center gap-1">
        <button
          onClick={onOpenSearch}
          title="Search chats"
          className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        <button
          onClick={onMobileClose}
          className="md:hidden p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          aria-label="Close menu"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        </div>
      </div>

      {/* New Chat */}
      <div className="px-3 mb-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Chat History */}
      <div className="px-3 mb-1">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 mb-1">
          Chat History
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-4 pb-2">
        {groupOrder.map(label => {
          const group = groups[label];
          if (!group || group.length === 0) return null;
          return (
            <div key={label}>
              <p className="text-xs text-gray-400 dark:text-gray-500 px-2 mb-1">{label}</p>
              {group.map(s => (
                <div
                  key={s.id}
                  className={`group relative flex items-center rounded-lg transition-colors ${
                    s.id === currentId
                      ? "bg-white dark:bg-gray-700 shadow-sm"
                      : "hover:bg-white/70 dark:hover:bg-gray-800"
                  }`}
                >
                  <button
                    onClick={() => { onLoadSession(s.id); setMenuOpenId(null); }}
                    className={`flex-1 text-left px-3 py-2 text-sm truncate ${
                      s.id === currentId
                        ? "text-gray-900 dark:text-gray-100 font-medium"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {s.title}
                  </button>

                  {/* Three-dot menu button — visible on hover or when menu is open */}
                  <button
                    onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === s.id ? null : s.id); }}
                    className={`flex-shrink-0 p-1.5 mr-1 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                      menuOpenId === s.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                    aria-label="Chat options"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
                    </svg>
                  </button>

                  {/* Dropdown */}
                  {menuOpenId === s.id && (
                    <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[120px]">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setMenuOpenId(null);
                          onDeleteSession(s.id);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}

        {sessions.filter(s => s.messages.length > 0).length === 0 && (
          <p className="text-xs text-gray-400 px-2 italic">No chats yet</p>
        )}
      </div>

      {/* Parent Portal link */}
      <div className="px-3 pb-1">
        <Link
          href="/parent"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Parent Portal
        </Link>
      </div>

      {/* Settings */}
      <div className="border-t border-gray-200 dark:border-gray-800 px-3 py-3">
        <button
          onClick={() => setSettingsOpen(o => !o)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 transition-colors"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </span>
          <svg
            className={`w-3.5 h-3.5 transition-transform ${settingsOpen ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {settingsOpen && (
          <div className="mt-2 px-2 space-y-3">
            {/* Student name */}
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Your name</label>
              <div className="flex gap-1.5">
                <input
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleNameSave(); }}
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 outline-none focus:border-blue-400"
                  placeholder="Enter your name"
                />
                <button
                  onClick={handleNameSave}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Theme toggle */}
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                {dark ? (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                  </svg>
                )}
                {dark ? "Dark mode" : "Light mode"}
              </span>
              <button
                onClick={onToggleTheme}
                className={`relative w-9 h-5 rounded-full transition-colors ${dark ? "bg-blue-500" : "bg-gray-300"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${dark ? "translate-x-4" : "translate-x-0"}`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
