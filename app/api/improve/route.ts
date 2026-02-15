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
    const { prompt, purpose, diagnosis, supplementAnswers } =
      await request.json();

    const systemPrompt = `プロンプト改善専門家。14ルール基準。JSONのみ返答。
{"improved":"改善プロンプト全文","changes":[{"location":"箇所","before":"元","after":"改善後","reason":"理由"}],"problems":["問題点"]}`;

    const userMessage = `【元】
${prompt}
【目的】${purpose || "全体改善"}
【診断】${JSON.stringify(diagnosis)}
【補完】${JSON.stringify(supplementAnswers)}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
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

    return NextResponse.json({ improvement: parsed });
  } catch (error) {
    console.error("Improve API error:", error);
    return NextResponse.json(
      { error: "APIエラーが発生しました" },
      { status: 500 }
    );
  }
}
