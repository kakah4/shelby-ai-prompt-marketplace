import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface PromptRow {
  id: number;
  title: string;
  category: string;
  price: string;
  preview: string;
  full_prompt: string;
  sample_output: string;
  creator: string;
  blob_url: string;
  created_at?: string;
}

export async function fetchPrompts(): Promise<PromptRow[]> {
  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error("fetchPrompts error:", error); return []; }
  return data || [];
}

export async function insertPrompt(prompt: Omit<PromptRow, "created_at">): Promise<void> {
  const { error } = await supabase.from("prompts").insert([prompt]);
  if (error) console.error("insertPrompt error:", error);
}
