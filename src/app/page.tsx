"use client";

import { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import ChatInterface from "@/components/ChatInterface";

const YEAR_LEVELS = ["Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12"];
const SUBJECTS = ["English", "Maths", "Science"];

export default function Home() {
  const [yearLevel, setYearLevel] = useState("Year 9");
  const [subject, setSubject] = useState("Maths");
  const sessionId = useRef(uuidv4()).current;

  return (
    <div className="flex flex-col h-full">
      {/* Selector bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-x-auto scrollbar-none flex-shrink-0">
        <select
          value={yearLevel}
          onChange={e => setYearLevel(e.target.value)}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 outline-none cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {YEAR_LEVELS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        {SUBJECTS.map(s => (
          <button
            key={s}
            onClick={() => setSubject(s)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              subject === s
                ? "bg-blue-500 text-white shadow-sm"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        <ChatInterface yearLevel={yearLevel} subject={subject} sessionId={sessionId} />
      </div>
    </div>
  );
}
