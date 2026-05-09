# Voxxi Yr 9 Maths Tutor — Handover Document

**Date:** May 2026  
**GitHub:** https://github.com/robop72/voxxi-yr9-maths-tutor  
**Live URL:** Auto-deployed via Vercel on push to `main`  
**Dev:** `npm run dev` → http://localhost:3002

---

## What This App Is

An AI-powered Year 9 Mathematics tutor for Australian students following the Victorian Curriculum 2.0. Built as a Next.js 14 frontend that proxies to a pre-existing Cloud Run backend. No database — all state lives in the browser (localStorage).

Target user: Year 9 students (aged 14–15) and their parents.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14.2 — App Router |
| Language | TypeScript |
| Styling | Tailwind CSS (`darkMode: "class"`) |
| State | React hooks + localStorage |
| Deployment | Vercel (GitHub auto-deploy) |
| Backend | Cloud Run (pre-existing, not in this repo) |

---

## Backend API

```
Base URL:  https://voxii-tutor-backend-919882895306.australia-southeast1.run.app
Endpoint:  POST /chat
Request:   { session_id: string, message: string }
Response:  { response: string }
```

The Next.js API route at `src/app/api/chat/route.ts` acts as a proxy and appends a comprehensive TUTOR_INSTRUCTION to every outgoing message before forwarding it to the backend.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Root — renders ChatInterface
│   ├── layout.tsx                  # HTML shell, Inter font, dark class
│   ├── globals.css                 # Bubble classes + keyframe animations
│   ├── api/chat/route.ts           # Proxy + TUTOR_INSTRUCTION injection
│   └── parent/
│       ├── page.tsx                # PIN gate (default PIN: 1234)
│       └── dashboard/page.tsx      # Parent Portal dashboard
├── components/
│   ├── ChatInterface.tsx           # Main UI (~600 lines)
│   ├── Sidebar.tsx                 # Left panel with history, pins, settings
│   └── SearchModal.tsx             # Full-text search
├── hooks/
│   ├── useChat.ts                  # Session state + API calls
│   ├── useTheme.ts                 # Dark/light mode
│   └── useParentAnalytics.ts       # Dashboard metrics from localStorage
└── utils/
    ├── tts.ts                      # Text-to-Speech (Web Speech API)
    ├── stt.ts                      # Speech-to-Text (Web Speech API)
    ├── strands.ts                  # VC2.0 strands + keyword detection
    └── safety.ts                   # Input safety screening + report storage
```

---

## Features Completed

### Chat Interface
- Gemini-style layout: fixed sidebar (desktop), slide-in drawer (mobile)
- User bubbles right-aligned (gray), tutor bubbles left-aligned (white) with strand badge
- **Paragraph-reveal animation** — tutor responses appear paragraph by paragraph (380ms stagger)
- **Inline markdown renderer** — bold, italic, inline code, headings, lists (no external library)
- **Thinking animation** — spinning arc + pulsing Voxxi favicon icon + animated dots
- Auto-growing textarea input, Enter to send, Shift+Enter for newline
- **Stop button** — cancels in-flight request via AbortController
- Auto-scroll to latest message

### Voice
- **Read Aloud toggle** — persists preference, bottom-left of input bar
- **Per-bubble TTS button** — appears after paragraph reveal completes
- Chrome keepalive (pause/resume every 10s to bypass 15s TTS cutoff bug)
- **Microphone STT** — en-AU locale, interim + final results, toggle button

### Chat History & Sidebar
- Sessions persisted to localStorage; empty sessions never saved or shown
- Always opens a fresh New Chat on page load
- Time-grouped history: Today / Yesterday / This week / Earlier
- **Pin chats** — pin icon on left (hover), pinned chats float to top section
- **Delete chats** — three-dot menu on right (hover), dropdown with Delete
- **Full-text search** — magnifier in sidebar header, searches all sessions
- Student name editable in Settings accordion
- Dark/light theme toggle

### Victorian Curriculum Strands
- 6 strands: Number, Algebra, Measurement, Space, Statistics, Probability
- Welcome screen shows strand cards; click to expand topic starter chips
- Keyword detection on every user message → strand badge on tutor responses

### Safety & Guardrails
- **Client-side input screening** (before every send):
  - Cheating prompts → warm refusal, redirected to learning
  - Self-harm / suicide / serious safety → blocked immediately, AU crisis numbers shown
  - Personal crisis disclosures → empathy + Kids Helpline, Lifeline, Beyond Blue
  - PII sharing → privacy reminder, message blocked
  - Frustration → passed through, AI handles warmly
- **Strong TUTOR_INSTRUCTION** (60+ rules): identity lock, hint-ladder policy, cheating refusal, uncertainty escalation, tone requirements, safety handling, prohibited outputs
- **Report button** — flag icon on every tutor bubble → logs to localStorage
- **Privacy reminder banner** on welcome screen

### Parent Portal
- PIN gate at `/parent` — default PIN `1234`, keyboard + on-screen numpad, shake animation on fail
- Auth via `sessionStorage` (clears on browser close)
- Dashboard at `/parent/dashboard`:
  - Weekly activity ring (SVG donut, minutes vs 60-min goal)
  - Stat cards: sessions this week, questions asked, topics covered, top strand
  - Sessions by day bar chart
  - Curriculum strand coverage bars
  - Recent sessions list (last 6, with strand badge + question count)
  - **Flagged responses** section (when student has reported something)
  - Coming-soon cards: Mastery Tree, Struggle Insights, Weekly Email, Subscription
- Sign out returns to student chat page

---

## localStorage / sessionStorage Keys

| Key | Type | Purpose |
|---|---|---|
| `voxxi-sessions` | `ChatSession[]` | All chat history (id, title, messages, createdAt, pinned) |
| `voxxi-student-name` | string | Student's display name |
| `voxxi-read-aloud` | "true"/"false" | TTS preference |
| `voxxi-parent-pin` | string | Parent portal PIN (default "1234") |
| `voxxi-reports` | `SafetyReport[]` | Flagged tutor responses |
| `voxxi-parent-auth` | "true" | sessionStorage — parent authenticated |

---

## What Still Needs Backend Work

These are critical for a compliant commercial launch with minors:

### High Priority (pre-launch requirements)
- [ ] **Server-side moderation API** — client-side pattern matching can be bypassed; need OpenAI Moderation or AWS Comprehend on the backend
- [ ] **Privacy Policy, Terms of Service, Child Safety Statement** — required under Australian Privacy Principles for apps targeting minors
- [ ] **Data encryption at rest** — Cloud Run + database must encrypt stored messages
- [ ] **No full prompts/responses in server logs** — current Cloud Run may log everything; needs filtering/redaction
- [ ] **API keys in Secret Manager** — not environment variables

### Important (post-launch)
- [ ] **Structured safety audit trail** — DB table: message_id, student_id, risk_level, moderation_category, created_at
- [ ] **Data retention policy** — auto-delete inactive accounts after defined period; parent-requested deletion endpoint
- [ ] **Role-based admin access** — staff can view flagged events only, with audit logging
- [ ] **Server-side rate limiting** — monthly message limits to prevent abuse
- [ ] **Parent account creation** — proper auth, link parent account to student account(s)
- [ ] **Weekly progress email** — scheduled digest to parent email

### Frontend (not yet built)
- [ ] Change PIN from parent portal settings
- [ ] "Reset conversation" button in chat
- [ ] Monthly usage counter in UI
- [ ] Curriculum Mastery Tree visualisation
- [ ] Struggle & Success Insights
- [ ] Export chat history for parent

---

## How to Resume Development

```bash
# 1. Clone / open project
cd "C:/Users/robop/Voxxi Yr 9 Maths Tutor"

# 2. Install deps (if needed)
npm install

# 3. Start dev server
npm run dev
# → http://localhost:3002

# 4. Push to deploy
git push origin main
# Vercel auto-deploys in ~60 seconds
```

**Rule:** Always invoke the `frontend-design` skill before writing any UI code (per `CLAUDE.md`).

---

## Key Design Decisions & Constraints

- **No external auth or DB** — deliberate for MVP; all state in localStorage
- **Hint-ladder mandatory** — TUTOR_INSTRUCTION enforces guide → example → step-by-step → only then reveal answer
- **CORS proxy** — Next.js `/api/chat` route is essential; browser can't call Cloud Run directly
- **Empty sessions never persisted** — filter runs on save AND on load to prevent "New Chat" clutter in history
- **Chrome TTS keepalive** — Chrome cancels utterances after 15s silence; the pause/resume interval in `tts.ts` works around this
- **Strand detection is client-side** — keyword scoring ported from the Python `tutor_app.py`, no API call needed
- **Safety screening is defence-in-depth** — the TUTOR_INSTRUCTION is the primary guardrail; `safety.ts` is a fast first pass that also handles things the AI shouldn't even see (crisis content, PII)

---

## Australian Compliance Notes

Because this app is used by minors (under 18):

- **Australian Privacy Principles (Privacy Act 1988)** apply — consent, data minimisation, access rights
- **Child safety** — do not store unnecessary personal data; have clear deletion process
- **Cyber safety** — in-app privacy reminders and PII blocking are in place; needs formal policy docs
- **Crisis resources displayed** — Kids Helpline (1800 55 1800), Lifeline (13 11 14), Beyond Blue (1300 22 4636) are shown for safety events
