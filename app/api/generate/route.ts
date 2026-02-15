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
    const { mode, category, goal, prompt, catAnswers, ruleAnswers } = body;

    const systemPrompt = `あなたはプロンプトエンジニアリングの最高レベルの専門家です。
ユーザーの回答を元に、14のルール準拠の最強プロンプトを生成してください。
モード：${mode === "refine" ? "既存プロンプト修正" : "一から作成"}
ルール：0.役割設定 1.目的分類 2.目的明確化 3.発動条件 4.現状整理 5.制約 6.思考プロセス 7.抽象度制御 8.PDCAループ 9.反証フェーズ 10.チェックリスト 11.例と非例 12.出力形式 13.情報不足時 14.停止条件
「指定なし」の項目はベストプラクティスで補完。
${mode === "refine" ? "元のプロンプトを活かし改善。修正箇所にコメント。" : "完全新規構築。"}
そのまま使えるプロンプト形式でマークダウン出力。複雑なら分割提案を冒頭に入れる。`;

    const catAnswersStr = Object.entries(catAnswers || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    const ruleAnswersStr = Object.entries(ruleAnswers || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const userMessage = `【モード】${mode === "refine" ? "既存プロンプト修正" : "一から作成"}
【カテゴリ】${category}
【目的】${goal}
【現プロンプト】${prompt || "なし"}
【詳細回答】
${catAnswersStr}
【ルール回答】
${ruleAnswersStr}`;

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
        .join("\n") || "生成に失敗しました。";

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
