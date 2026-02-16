import { NextRequest, NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { prompt, purpose, diagnosis, supplementAnswers } =
      await request.json();

    const systemPrompt = `プロンプト改善専門家。14ルール基準。JSONのみ返答。
{"improved":"改善プロンプト全文","changes":[{"location":"箇所","before":"元","after":"改善後","reason":"理由"}],"problems":["問題点"]}`;

    const userMessage = `【元】
${prompt}
【目的】${purpose || "全体改善"}
【診断】${JSON.stringify(diagnosis)}
【補完】${JSON.stringify(supplementAnswers)}`;

    const text = await callGemini({
      systemPrompt,
      userMessage,
      maxTokens: 4000,
    });

    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ improvement: parsed });
  } catch (error) {
    console.error("Improve API error:", error);
    return NextResponse.json(
      { error: "APIエラーが発生しました" },
      { status: 500 }
    );
  }
}
