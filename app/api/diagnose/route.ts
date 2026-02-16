import { NextRequest, NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    const systemPrompt = `プロンプト診断AI。14ルールで診断。JSONのみ返答。
{"ok":[{"point":"良い点","reason":"理由"}],"missing":[{"point":"足りない","suggestion":"追加すべき"}],"unclear":[{"point":"曖昧","suggestion":"明確にすべき"}],"questions":[{"question":"補完質問","options":["A","B","C"]}],"summary":"総評"}
具体的に。questions最大5問。`;

    const text = await callGemini({
      systemPrompt,
      userMessage: prompt,
      maxTokens: 2000,
    });

    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ diagnosis: parsed });
  } catch (error) {
    console.error("Diagnose API error:", error);
    return NextResponse.json(
      {
        diagnosis: {
          ok: [],
          missing: [],
          unclear: [],
          questions: [],
          summary: "診断に失敗しました。再度お試しください。",
        },
      },
      { status: 200 }
    );
  }
}
