import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  "https://voxii-tutor-backend-919882895306.australia-southeast1.run.app";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const formattedBody = {
    ...body,
    message:
      body.message +
      "\n\n[Format your response with short paragraphs (2-3 sentences each). Use numbered steps for procedures and bullet points for lists. Split your answer into clear sections with a blank line between each. Keep the total response concise.]",
  };

  const upstream = await fetch(`${BACKEND_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formattedBody),
  });

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
