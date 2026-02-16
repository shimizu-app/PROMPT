const GEMINI_MODEL = "gemini-2.0-flash";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

export class GeminiError extends Error {
  status: number;
  userMessage: string;

  constructor(status: number, userMessage: string, detail?: string) {
    super(detail || userMessage);
    this.status = status;
    this.userMessage = userMessage;
  }
}

export async function callGemini(options: {
  systemPrompt?: string;
  userMessage: string;
  maxTokens?: number;
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiError(500, "APIキーが設定されていません。管理者に連絡してください。");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = {
    contents: [
      { role: "user", parts: [{ text: options.userMessage }] },
    ],
    generationConfig: {
      maxOutputTokens: options.maxTokens || 2000,
    },
  };

  if (options.systemPrompt) {
    body.systemInstruction = {
      parts: [{ text: options.systemPrompt }],
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.text();
    console.error(`Gemini API error: ${res.status} ${errorData}`);

    if (res.status === 429) {
      throw new GeminiError(
        429,
        "APIの利用上限に達しました。しばらく待ってから再度お試しください。",
        errorData
      );
    }
    if (res.status === 403) {
      throw new GeminiError(
        403,
        "APIキーが無効です。設定を確認してください。",
        errorData
      );
    }
    throw new GeminiError(
      res.status,
      "AI処理中にエラーが発生しました。再度お試しください。",
      errorData
    );
  }

  const data: GeminiResponse = await res.json();
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text || "")
    .join("") || "";

  return text;
}
