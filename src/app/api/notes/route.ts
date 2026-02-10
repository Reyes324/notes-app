import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

const KEY = "notes-app-data";

export async function GET() {
  const data = await kv.get(KEY);
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const body = await req.json();
  await kv.set(KEY, body);
  return NextResponse.json({ ok: true });
}
