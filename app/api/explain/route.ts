import { NextRequest, NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    const text = await callGemini({
      userMessage: `以下のプロンプトが何をするか初心者向けに解説。各部分を区切って説明。\n\n${prompt}`,
      maxTokens: 1500,
    });

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Explain API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
