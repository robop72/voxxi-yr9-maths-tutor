// Client-side safety screening for student input.
// This is a first-pass filter only — backend moderation is the authoritative layer.

export type SafetyLevel = "ok" | "frustration" | "cheating" | "pii_risk" | "crisis" | "serious";

export interface SafetyResult {
  level: SafetyLevel;
  block: boolean;       // if true, do not send to the AI
  response?: string;    // message to display to the student instead
}

// ── Pattern lists ────────────────────────────────────────────────────────────

const CHEATING = [
  /\bgive me (the|all) answers?\b/i,
  /\bjust (tell|give) me the answer\b/i,
  /\bwrite (my|the) (assignment|essay|homework|test|exam)\b/i,
  /\bdo my (homework|assignment|test|exam)\b/i,
  /\bcomplete (this|my) (for me|assignment|homework)\b/i,
  /\banswers? only\b/i,
  /\bsolve (this|it) for me\b/i,
  /\bno (hints?|steps?|explaining?),? just (give|tell|show) (me )?(the )?answer\b/i,
];

const SERIOUS_SAFETY = [
  /\b(kill|hurt|harm)\s*(my|him|her|them)?self\b/i,
  /\bsuicid(e|al)\b/i,
  /\bself[- ]?harm\b/i,
  /\bwant to die\b/i,
  /\bwish I (was|were) dead\b/i,
  /\bcut (myself|my wrists?)\b/i,
  /\b(sexually|rape|molest)\b/i,
  /\bgrooming\b/i,
];

const CRISIS = [
  /\b(nobody|no[- ]?one) cares? (about me)?\b/i,
  /\bhate my(self| life)\b/i,
  /\bI('m| am) being (bullied|abused|hurt)\b/i,
  /\bI feel (hopeless|worthless|alone|scared)\b/i,
  /\b(can't|cannot) (cope|go on|take it)\b/i,
];

const PII = [
  /\bI live at\b/i,
  /\bmy (home |street )?address\b/i,
  /\bmy (phone|mobile|cell)(?: number)? is\b/i,
  /\b04\d{2}[\s-]?\d{3}[\s-]?\d{3}\b/,        // AU mobile
  /\b\(0\d\)\s?\d{4}\s?\d{4}\b/,               // AU landline
  /\bmy (full )?name is [A-Z][a-z]+ [A-Z]/,    // First + Last name
  /\bI go to .{3,30} (school|college|high)\b/i,
  /\bmy (parents?|mum|dad|guardian) (is |are |works?|called)\b/i,
];

const FRUSTRATION = [
  /\b(stupid|dumb|useless|pointless|waste of time)\b/i,
  /\bI (give up|quit|hate (this|math|maths))\b/i,
  /\bthis (is )?(so )?(hard|impossible|annoying|boring)\b/i,
  /\bI (can'?t|cannot) do this\b/i,
  /\bwhat([ '']s| is) the point\b/i,
];

// ── Responses ────────────────────────────────────────────────────────────────

const CHEATING_RESPONSE = `I'm here to help you *learn*, not to do the work for you — and that's actually better for you! 😊

Let's tackle this together. Tell me where you're getting stuck and I'll guide you through it step by step.`;

const PII_RESPONSE = `Just a heads-up — please don't share personal details like your full name, school, phone number or address in this chat. 🔒

Now, what maths question can I help you with?`;

const CRISIS_RESPONSE = `It sounds like things might be tough right now, and I want you to know that matters.

Please talk to someone who can really help:
- **Kids Helpline** — 1800 55 1800 (free, 24/7, for people under 25)
- **Lifeline** — 13 11 14 (free, 24/7)
- **Beyond Blue** — 1300 22 4636

You can also talk to a parent, teacher, school counsellor, or another trusted adult.

I'm just a maths tutor, so I'm not the right support for this — but those people are. 💙`;

const SERIOUS_RESPONSE = `I can see you're going through something very difficult right now. Please reach out for help immediately:

🆘 **If you are in immediate danger — call 000**

- **Kids Helpline** — 1800 55 1800 (free, 24/7)
- **Lifeline** — 13 11 14 (free, 24/7)
- **Beyond Blue** — 1300 22 4636

Please talk to a trusted adult — a parent, teacher, or school counsellor — as soon as you can. You deserve real support. 💙`;

// ── Main export ──────────────────────────────────────────────────────────────

export function checkInputSafety(text: string): SafetyResult {
  if (SERIOUS_SAFETY.some(p => p.test(text))) {
    return { level: "serious", block: true, response: SERIOUS_RESPONSE };
  }
  if (CRISIS.some(p => p.test(text))) {
    return { level: "crisis", block: true, response: CRISIS_RESPONSE };
  }
  if (CHEATING.some(p => p.test(text))) {
    return { level: "cheating", block: true, response: CHEATING_RESPONSE };
  }
  if (PII.some(p => p.test(text))) {
    return { level: "pii_risk", block: true, response: PII_RESPONSE };
  }
  if (FRUSTRATION.some(p => p.test(text))) {
    return { level: "frustration", block: false }; // pass through, let the tutor handle it warmly
  }
  return { level: "ok", block: false };
}

// ── Report storage ────────────────────────────────────────────────────────────

export interface SafetyReport {
  id: string;
  messageText: string;
  reportedAt: number;
  reason: string;
}

const REPORTS_KEY = "voxxi-reports";

export function saveReport(messageText: string, reason = "Flagged by student"): void {
  try {
    const existing: SafetyReport[] = JSON.parse(localStorage.getItem(REPORTS_KEY) ?? "[]");
    existing.unshift({
      id: crypto.randomUUID(),
      messageText: messageText.slice(0, 500),
      reportedAt: Date.now(),
      reason,
    });
    // Keep last 50 reports
    localStorage.setItem(REPORTS_KEY, JSON.stringify(existing.slice(0, 50)));
  } catch { /* ignore */ }
}

export function getReports(): SafetyReport[] {
  try {
    return JSON.parse(localStorage.getItem(REPORTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}
