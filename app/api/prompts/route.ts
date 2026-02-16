import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// GET /api/prompts - 保存済みプロンプト一覧
export async function GET() {
  const { data, error } = await getSupabase()
    .from("prompts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prompts: data });
}

// POST /api/prompts - プロンプト保存
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, category, goal, original_prompt, cat_answers, rule_answers, generated_prompt } = body;

    if (!generated_prompt) {
      return NextResponse.json({ error: "generated_prompt is required" }, { status: 400 });
    }

    const { data, error } = await getSupabase()
      .from("prompts")
      .insert({
        mode: mode || "",
        category: category || "",
        goal: goal || "",
        original_prompt: original_prompt || "",
        cat_answers: cat_answers || {},
        rule_answers: rule_answers || {},
        generated_prompt,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ prompt: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
