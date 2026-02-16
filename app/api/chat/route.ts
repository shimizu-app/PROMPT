import { NextRequest, NextResponse } from "next/server";
import { callGemini, GeminiError } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { system, message, maxTokens } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const text = await callGemini({
      systemPrompt: system || undefined,
      userMessage: message,
      maxTokens: maxTokens || 2000,
    });

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Chat API error:", error);
    if (error instanceof GeminiError) {
      return NextResponse.json(
        { error: error.userMessage },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: "AI処理中にエラーが発生しました。再度お試しください。" },
      { status: 500 }
    );
  }
}
