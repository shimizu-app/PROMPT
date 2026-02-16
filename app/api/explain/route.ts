import { NextRequest, NextResponse } from "next/server";
import { callGemini, GeminiError } from "@/lib/gemini";

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
    if (error instanceof GeminiError) {
      return NextResponse.json(
        { error: error.userMessage },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: "解説処理中にエラーが発生しました。再度お試しください。" },
      { status: 500 }
    );
  }
}
