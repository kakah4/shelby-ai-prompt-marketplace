import { useEffect, useState } from "react";
import { fetchPrompts, fetchCreator } from "../lib/supabase";
import { styles as s } from "../styles";
import PromptCard from "../components/PromptCard";
import PromptModal from "../components/PromptModal";
import type { PromptRow, CreatorRow } from "../types";

const CATEGORIES = ["All", "Midjourney", "ChatGPT", "Claude", "Stable Diffusion", "Gemini", "Other"];

export default function Marketplace() {
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [creators, setCreators] = useState<Record<string, CreatorRow | null>>({});
  const [activeCat, setActiveCat] = useState("All");
  const [search, setSearch] = useState("");
  const [activePrompt, setActivePrompt] = useState<PromptRow | null>(null);

  useEffect(() => {
    fetchPrompts().then(async rows => {
      setPrompts(rows);
      const uniqueCreators = Array.from(new Set(rows.map(r => r.creator).filter(Boolean)));
      const entries = await Promise.all(
        uniqueCreators.map(async addr => [addr, await fetchCreator(addr)] as const)
      );
      setCreators(Object.fromEntries(entries));
    });
  }, []);

  const filtered = prompts.filter(p => {
    const matchCat = activeCat === "All" || p.category === activeCat;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", background: "#fff", minHeight: "100vh", paddingTop: 64 }}>
      <section style={s.section}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
          <h2 style={s.sectionTitle}>Browse Prompts</h2>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search prompts…"
            style={{ fontSize: 13, color: "var(--text)", background: "#fff", border: "1px solid var(--border2)", borderRadius: 10, padding: "9px 14px", outline: "none", width: 220 }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              style={{ fontSize: 13, fontWeight: 500, color: activeCat === cat ? "var(--pink)" : "var(--muted)", background: activeCat === cat ? "var(--pinkbg)" : "#fff", border: `1px solid ${activeCat === cat ? "var(--pinkbr)" : "var(--border2)"}`, borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}
            >
              {cat}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80, color: "var(--subtle)" }}>No prompts found yet — be the first to upload one!</div>
        ) : (
          <div style={s.grid}>
            {filtered.map(p => (
              <PromptCard key={p.id} prompt={p} creator={creators[p.creator]} onOpen={setActivePrompt} />
            ))}
          </div>
        )}
      </section>

      {activePrompt && <PromptModal prompt={activePrompt} onClose={() => setActivePrompt(null)} />}
    </div>
  );
}
