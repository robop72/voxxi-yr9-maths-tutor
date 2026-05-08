import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  "https://voxii-tutor-backend-919882895306.australia-southeast1.run.app";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const upstream = await fetch(`${BACKEND_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
