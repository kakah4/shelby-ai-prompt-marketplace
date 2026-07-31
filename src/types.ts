export interface PromptRow {
  id: number;
  title: string;
  category: string;
  price: string;
  preview: string;
  full_prompt: string;
  sample_output: string;
  proof_image_url: string;
  creator: string; // full wallet address
  blob_url: string;
  created_at?: string;
}

export interface CreatorRow {
  address: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  created_at?: string;
}
