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
    const body = await request.json();

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `以下から、やりたいことを3-5行で要約。「あなたがやりたいのは〜ですね？」形式で。複雑なら分割提案も。\n${JSON.stringify(body)}`,
          },
        ],
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

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Confirm API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
