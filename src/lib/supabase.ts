import { createClient } from "@supabase/supabase-js";
import type { PromptRow, CreatorRow } from "../types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ── Prompts ──────────────────────────────────────────────
export async function fetchPrompts(): Promise<PromptRow[]> {
  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error("fetchPrompts error:", error); return []; }
  return data || [];
}

export async function fetchPromptsByCreator(address: string): Promise<PromptRow[]> {
  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .eq("creator", address)
    .order("created_at", { ascending: false });
  if (error) { console.error("fetchPromptsByCreator error:", error); return []; }
  return data || [];
}

export async function insertPrompt(prompt: Omit<PromptRow, "created_at">): Promise<void> {
  const { error } = await supabase.from("prompts").insert([prompt]);
  if (error) console.error("insertPrompt error:", error);
}

export async function deletePrompt(id: number): Promise<boolean> {
  const { error } = await supabase.from("prompts").delete().eq("id", id);
  if (error) { console.error("deletePrompt error:", error); return false; }
  return true;
}

// ── Creators ─────────────────────────────────────────────
export async function fetchCreator(address: string): Promise<CreatorRow | null> {
  const { data, error } = await supabase
    .from("creators")
    .select("*")
    .eq("address", address)
    .maybeSingle();
  if (error) { console.error("fetchCreator error:", error); return null; }
  return data;
}

export async function upsertCreator(creator: Omit<CreatorRow, "created_at">): Promise<void> {
  const { error } = await supabase.from("creators").upsert([creator], { onConflict: "address" });
  if (error) console.error("upsertCreator error:", error);
}
