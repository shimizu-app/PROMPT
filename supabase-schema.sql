-- Run this in Supabase Dashboard > SQL Editor
-- テーブル作成
CREATE TABLE prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  mode TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  goal TEXT NOT NULL DEFAULT '',
  original_prompt TEXT DEFAULT '',
  cat_answers JSONB DEFAULT '{}',
  rule_answers JSONB DEFAULT '{}',
  generated_prompt TEXT NOT NULL
);

-- RLS有効化
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- 匿名アクセス許可（認証なし）
CREATE POLICY "Allow anonymous read" ON prompts FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON prompts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous delete" ON prompts FOR DELETE USING (true);
