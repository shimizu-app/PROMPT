import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface PromptRow {
  id: string;
  created_at: string;
  mode: string;
  category: string;
  goal: string;
  original_prompt: string;
  cat_answers: Record<string, string>;
  rule_answers: Record<string, string>;
  generated_prompt: string;
}
