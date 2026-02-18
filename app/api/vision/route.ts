import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODEL = "gemini-2.0-flash";

export async function POST(request: NextRequest) {
  try {
    const { image, prompt, maxTokens } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "APIキーが設定されていません。管理者に連絡してください。" },
        { status: 500 }
      );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const parts: Array<Record<string, unknown>> = [];

    if (image) {
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: image,
        },
      });
    }

    parts.push({ text: prompt });

    const body = {
      contents: [{ role: "user", parts }],
      generationConfig: {
        maxOutputTokens: maxTokens || 1500,
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error(`Gemini Vision API error: ${res.status} ${errorData}`);

      if (res.status === 429) {
        return NextResponse.json(
          { error: "APIの利用上限に達しました。しばらく待ってから再度お試しください。" },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "画像解析中にエラーが発生しました。再度お試しください。" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text || "")
        .join("") || "";

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Vision API error:", error);
    return NextResponse.json(
      { error: "画像解析中にエラーが発生しました。再度お試しください。" },
      { status: 500 }
    );
  }
}
