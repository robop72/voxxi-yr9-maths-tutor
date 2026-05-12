import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt } from "@/utils/buildSystemPrompt";

const BACKEND_URL = "https://voxii-tutor-backend-919882895306.australia-southeast1.run.app";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const yearLevel = parseInt(body.year_level?.replace(/\D/g, "") ?? "9", 10);
  const subject: string = body.subject ?? "Maths";

  const systemPrompt = buildSystemPrompt(subject, yearLevel);

  const upstream = await fetch(`${BACKEND_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...body,
      message: body.message + `\n\n[SYSTEM NOTE: ${systemPrompt}]`,
    }),
  });

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
