import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const { prompt } = await request.json();

    const systemPrompt = `プロンプト診断AI。14ルールで診断。JSONのみ返答。
{"ok":[{"point":"良い点","reason":"理由"}],"missing":[{"point":"足りない","suggestion":"追加すべき"}],"unclear":[{"point":"曖昧","suggestion":"明確にすべき"}],"questions":[{"question":"補完質問","options":["A","B","C"]}],"summary":"総評"}
具体的に。questions最大5問。`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      return NextResponse.json(
        { error: `Anthropic API error: ${res.status}`, details: errorData },
        { status: res.status }
      );
    }

    const data = await res.json();
    const text =
      data.content
        ?.map((c: { type: string; text?: string }) =>
          c.type === "text" ? c.text : ""
        )
        .join("\n") || "";

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
