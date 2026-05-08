# Voxxi Yr 9 Maths Tutor — Claude Build Rules

## Project Overview
Premium AI-powered Year 9 Maths tutor chat interface. Gemini-inspired aesthetic — minimalist, modern, polished.

## Stack
- Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS
- Port: 3002 (`npm run dev`)
- No database, no auth — pure chat frontend

## Backend
- Base URL: `https://voxii-tutor-backend-919882895306.australia-southeast1.run.app`
- Endpoint: `POST /chat`
- Request: `{ session_id: string, message: string }`
- Response: `{ response: string }`
- Session ID: random UUID generated once per page load (in `useChat` hook via `useRef`)

## Architecture
- `src/hooks/useChat.ts` — conversation state, isLoading, session_id, fetch logic
- `src/components/ChatInterface.tsx` — full UI: header, message list, input bar
- `src/utils/tts.ts` — Web Speech API wrapper (speak, stopSpeaking, isSpeaking)
- `src/app/globals.css` — Tailwind base + custom `.voxii-bubble-*` component classes

## Styling Rules
- User bubbles: `voxii-bubble-user` — gray/blue bg, right-aligned, `rounded-br-sm`
- Tutor bubbles: `voxii-bubble-tutor` — white bg, left-aligned, `rounded-bl-sm`
- Thinking bubble: `voxii-thinking-bubble` — ripple animation via `::before` keyframe
- Max chat width: `max-w-2xl` centered
- Input: pill-shaped `rounded-3xl`, sticky bottom

## TTS Rules
- Use browser `window.speechSynthesis` only (no external API)
- Volume icon appears on hover over tutor bubble (`group-hover`)
- Active (speaking) state: icon turns `text-blue-500`
- Cancels previous utterance before starting a new one
- Prefers Google/Natural/Enhanced/Premium English voices

## DO NOT
- Add a database or auth layer unless explicitly asked
- Change the backend URL or endpoint contract
- Use `pages/` directory — App Router only
- Add unnecessary comments or docstrings
