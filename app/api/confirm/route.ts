import { NextRequest, NextResponse } from "next/server";
import { callGemini, GeminiError } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const text = await callGemini({
      userMessage: `以下から、やりたいことを3-5行で要約。「あなたがやりたいのは〜ですね？」形式で。複雑なら分割提案も。\n${JSON.stringify(body)}`,
      maxTokens: 1000,
    });

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Confirm API error:", error);
    if (error instanceof GeminiError) {
      return NextResponse.json(
        { error: error.userMessage },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: "確認処理中にエラーが発生しました。再度お試しください。" },
      { status: 500 }
    );
  }
}
