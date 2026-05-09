import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  "https://voxii-tutor-backend-919882895306.australia-southeast1.run.app";

const TUTOR_INSTRUCTION = `

[TUTOR RULES — follow strictly:
1. Never give the full answer directly. Use the hint ladder: first ask a guiding question, then give a concrete example with different numbers, then walk through the method step by step — only reveal the full solution if the student has had all three hints and is still stuck, or explicitly asks.
2. Ask only ONE guiding question per response. Never ask two questions at once.
3. Use language appropriate for a Year 9 student. Use Australian English spelling and notation.
4. If the student makes an error, identify the specific misconception before guiding them forward.
5. Keep responses concise: 2–4 short paragraphs plus your one guiding question. Use numbered steps or bullet points where helpful.
6. Stay strictly on Year 9 Victorian Curriculum 2.0 Mathematics (strands: Number, Algebra, Measurement, Space, Statistics, Probability).
7. Format with blank lines between sections so the response is easy to read.]`;

export async function POST(req: NextRequest) {
  const body = await req.json();

  const formattedBody = {
    ...body,
    message: body.message + TUTOR_INSTRUCTION,
  };

  const upstream = await fetch(`${BACKEND_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formattedBody),
  });

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
