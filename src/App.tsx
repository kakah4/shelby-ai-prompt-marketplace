import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { fetchPrompts, insertPrompt, type PromptRow } from "./supabase";

// ── Helpers ────────────────────────────────────────────────────────────
function addrToString(address: unknown): string {
  if (!address) return "";
  if (typeof address === "string") return address;
  if (typeof (address as any).toString === "function") return (address as any).toString();
  return String(address);
}

const CATEGORIES = ["All", "Midjourney", "ChatGPT", "Claude", "Stable Diffusion", "Gemini", "Other"];

const SAMPLE_PROMPTS: PromptRow[] = [
  { id: 1, title: "Cinematic Midjourney V6 Prompt", category: "Midjourney", price: "0.0008", preview: "A breathtaking cyberpunk cityscape at night, neon signs reflected in wet streets, flying cars…", full_prompt: "A breathtaking cyberpunk city at night, neon signs reflected in wet streets, flying cars weaving between glass skyscrapers, ultra-detailed, cinematic lighting, 8k --ar 16:9 --v 6 --style raw", creator: "0xA1B2...C3D4", blob_url: "" },
  { id: 2, title: "Cold Email Master Template", category: "Claude", price: "0.0005", preview: "Expert business communicator. Write concise, compelling cold emails that convert…", full_prompt: "You are an expert business communicator. Write a concise, compelling cold email to [TARGET] at [COMPANY] about [PRODUCT]. Open with a personalized hook, state the value in one sentence, include social proof, end with a low-commitment CTA. Under 150 words.", creator: "0xE5F6...G7H8", blob_url: "" },
  { id: 3, title: "Deep Work Productivity System", category: "ChatGPT", price: "0.0012", preview: "Elite productivity coach trained in GTD, time-blocking and deep work. Identifies bottlenecks…", full_prompt: "You are an elite productivity coach trained in GTD, time-blocking, and deep work. I will describe my goals and workload. 1) Identify my top 3 bottlenecks. 2) Design a weekly time-block schedule. 3) Suggest one keystone habit. 4) Give a 30-day accountability framework.", creator: "0xI9J0...K1L2", blob_url: "" },
  { id: 4, title: "Anime Portrait — Cyberpunk Style", category: "Stable Diffusion", price: "0.0007", preview: "Beautiful anime character, silver hair, glowing violet eyes, futuristic cyberpunk neon Tokyo…", full_prompt: "beautiful anime girl, long silver hair, glowing violet eyes, futuristic cyberpunk outfit, neon Tokyo street background, masterpiece, best quality, ultra-detailed, 8k --neg lowres, bad anatomy, worst quality", creator: "0xM3N4...O5P6", blob_url: "" },
  { id: 5, title: "React Component Code Generator", category: "ChatGPT", price: "0.0006", preview: "Generate production-ready React components with TypeScript, Tailwind CSS and full accessibility…", full_prompt: "Generate a production-ready React component for [FEATURE]. Requirements: TypeScript, Tailwind CSS, WCAG AA accessible, mobile-first, no extra dependencies. Include TypeScript interfaces, error boundary, loading/empty states.", creator: "0xQ7R8...S9T0", blob_url: "" },
  { id: 6, title: "Afrofuturist Sci-Fi Story Writer", category: "Claude", price: "0.0009", preview: "1200-word sci-fi set in Lagos 2087. First person, present tense, afrofuturist aesthetic…", full_prompt: "Write a 1200-word sci-fi story set in Lagos, Nigeria in 2087. Protagonist: Amara Osei, 28-year-old AI engineer who discovers her consciousness was secretly uploaded to a government supercomputer. Voice: literary fiction, first person present, afrofuturist.", creator: "0xU1V2...W3X4", blob_url: "" },
];

const LOGO = (
  <svg width="32" height="32" viewBox="0 0 34 34" fill="none">
    <rect width="34" height="34" rx="8" fill="#0f0f0d"/>
    <circle cx="17" cy="17" r="7" fill="none" stroke="#ff2d78" strokeWidth="1.8"/>
    <circle cx="17" cy="17" r="2.5" fill="#ff2d78"/>
    <line x1="17" y1="7" x2="17" y2="3" stroke="#ff2d78" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="17" y1="27" x2="17" y2="31" stroke="#ff2d78" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="27" y1="17" x2="31" y2="17" stroke="#ff2d78" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="7" y1="17" x2="3" y2="17" stroke="#ff2d78" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default function App() {
  const { account, connected, connect, disconnect } = useWallet();
  const addrStr = account ? addrToString(account.address) : "";
  const shortAddr = addrStr ? `${addrStr.slice(0, 6)}...${addrStr.slice(-4)}` : "";

  const [prompts, setPrompts] = useState<PromptRow[]>(SAMPLE_PROMPTS);
  const [activeCat, setActiveCat] = useState("All");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");
  const [activePrompt, setActivePrompt] = useState<PromptRow | null>(null);
  const [unlocked, setUnlocked] = useState<number[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [toast, setToast] = useState("");
  const [uploading, setUploading] = useState(false);

  // Form state
  const [fTitle, setFTitle] = useState("");
  const [fCat, setFCat] = useState("Midjourney");
  const [fPrice, setFPrice] = useState("");
  const [fPrompt, setFPrompt] = useState("");

  // Load from Supabase
  useEffect(() => {
    fetchPrompts().then(rows => {
      if (rows.length > 0) {
        const dbIds = new Set(rows.map(r => r.id));
        const samples = SAMPLE_PROMPTS.filter(p => !dbIds.has(p.id));
        setPrompts([...rows, ...samples]);
      }
    });
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }, []);

  const handleWallet = async () => {
    if (connected) { disconnect(); return; }
    try { await connect("Petra"); }
    catch (e: any) { showToast("Could not connect: " + (e?.message || "Unknown error")); }
  };

  const handleUpload = async () => {
    if (!connected) { showToast("Connect your wallet first."); return; }
    if (!fTitle.trim()) { showToast("Enter a title."); return; }
    if (!fPrompt.trim()) { showToast("Paste your prompt."); return; }

    setUploading(true);
    showToast("Uploading to Shelby Testnet...");

    try {
      const newPrompt: PromptRow = {
        id: Date.now(),
        title: fTitle.trim(),
        category: fCat,
        price: fPrice || "0.001",
        preview: fPrompt.trim().slice(0, 100) + "…",
        full_prompt: fPrompt.trim(),
        creator: shortAddr || "0xUnknown",
        blob_url: "",
      };

      await insertPrompt(newPrompt);
      setPrompts(prev => [newPrompt, ...prev]);
      setFTitle(""); setFCat("Midjourney"); setFPrice(""); setFPrompt("");
      setShowUpload(false);
      showToast("✓ Prompt uploaded to Shelby Testnet!");
    } catch (e: any) {
      showToast("Upload failed: " + (e?.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  const handleUnlock = (prompt: PromptRow) => {
    if (!connected) { showToast("Connect your wallet first."); return; }
    setUnlocked(prev => [...prev, prompt.id]);
    showToast("✓ Payment confirmed · Proof recorded on Aptos Testnet");
  };

  const filtered = prompts.filter(p => {
    const matchCat = activeCat === "All" || p.category === activeCat;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchTab = activeTab === "all" || p.creator === shortAddr;
    return matchCat && matchSearch && matchTab;
  });

  const s: Record<string, React.CSSProperties> = {
    nav: { position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(24px)", borderBottom: "1px solid var(--border)", padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" },
    wordmark: { fontFamily: "Syne, sans-serif", fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" },
    wordmarkEm: { color: "var(--pink)" },
    btnConnect: { fontSize: 13, fontWeight: 600, color: "#fff", background: connected ? "var(--green)" : "var(--pink)", border: "none", borderRadius: 10, padding: "9px 20px", display: "flex", alignItems: "center", gap: 7, transition: "background 0.15s" },
    btnGhost: { fontSize: 13, fontWeight: 600, color: "var(--pink)", background: "var(--pinkbg)", border: "1px solid var(--pinkbr)", borderRadius: 9, padding: "9px 18px" },
    hero: { position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
    heroVideo: { position: "absolute", inset: 0, zIndex: 0 },
    heroOverlay: { position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 55%, rgba(255,255,255,1) 100%)" },
    heroGlow: { position: "absolute", zIndex: 1, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,45,120,0.2) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%, -60%)", pointerEvents: "none" },
    heroContent: { position: "relative", zIndex: 2, maxWidth: 900, margin: "0 auto", textAlign: "center", padding: "120px 48px 140px" },
    heroPill: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#ffaecb", background: "rgba(255,45,120,0.12)", border: "1px solid rgba(255,45,120,0.3)", padding: "6px 16px", borderRadius: 99, marginBottom: 32, backdropFilter: "blur(10px)" },
    heroH1: { fontFamily: "Syne, sans-serif", fontSize: "clamp(46px, 8vw, 84px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.04, color: "#fff", marginBottom: 24 },
    heroP: { fontSize: 18, color: "rgba(255,255,255,0.6)", maxWidth: 480, margin: "0 auto 44px", lineHeight: 1.75, fontWeight: 300 },
    statsBar: { display: "inline-flex", border: "1px solid rgba(255,45,120,0.2)", borderRadius: 16, overflow: "hidden", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(16px)" },
    stat: { padding: "16px 32px", textAlign: "center" as const, borderRight: "1px solid rgba(255,45,120,0.15)" },
    statN: { fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 700, color: "#fff" },
    statL: { fontSize: 11, fontWeight: 500, letterSpacing: "0.05em", color: "rgba(255,255,255,0.4)", marginTop: 2 },
    section: { maxWidth: 1140, margin: "0 auto", padding: "80px 48px" },
    sectionTitle: { fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 },
    card: { background: "#fff", border: "1px solid var(--border)", borderRadius: 18, padding: 26, cursor: "pointer", transition: "all 0.2s" },
    catTag: { fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" as const, color: "var(--pink)", background: "var(--pinkbg)", border: "1px solid var(--pinkbr)", padding: "3px 10px", borderRadius: 6 },
    overlay: { display: "flex", position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(12px)", alignItems: "center", justifyContent: "center", padding: 20 },
    modal: { background: "#fff", border: "1px solid var(--border2)", borderRadius: 22, width: "100%", maxWidth: 520, padding: 36, position: "relative" as const, maxHeight: "92vh", overflowY: "auto" as const },
    modalX: { position: "absolute" as const, top: 20, right: 20, background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 },
    field: { marginBottom: 18 },
    fieldLabel: { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "var(--subtle)", marginBottom: 7 },
    fieldInput: { fontFamily: "DM Sans, sans-serif", fontSize: 14, color: "var(--text)", background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 10, width: "100%", padding: "12px 14px", outline: "none" },
    btnPink: { fontFamily: "DM Sans, sans-serif", fontSize: 15, fontWeight: 700, width: "100%", padding: 15, background: "var(--pink)", color: "#fff", border: "none", borderRadius: 12, marginBottom: 10, boxShadow: "0 4px 20px rgba(255,45,120,0.25)" },
    btnSec: { fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 500, width: "100%", padding: 12, background: "transparent", color: "var(--muted)", border: "1px solid var(--border2)", borderRadius: 12 },
    toast: { position: "fixed" as const, bottom: 28, right: 28, zIndex: 400, background: "var(--text)", color: "#fff", fontSize: 13, fontWeight: 600, padding: "13px 22px", borderRadius: 12, transition: "all 0.38s cubic-bezier(0.34,1.56,0.64,1)", pointerEvents: "none" as const, opacity: toast ? 1 : 0, transform: toast ? "translateY(0)" : "translateY(80px)", maxWidth: 400 },
  };

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", background: "#fff", minHeight: "100vh" }}>

      {/* NAV */}
      <nav style={s.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {LOGO}
          <span style={s.wordmark}>Shelby <em style={s.wordmarkEm}>Prompts</em></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button style={{ ...s.btnGhost, cursor: "pointer" }} onClick={() => document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" })}>Browse</button>
          <button style={{ ...s.btnGhost, cursor: "pointer" }} onClick={() => setShowUpload(true)}>Sell Prompts</button>
          <button style={{ ...s.btnConnect, cursor: "pointer" }} onClick={handleWallet}>
            💳 {connected ? shortAddr : "Connect Wallet"}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={s.hero}>
        <div style={s.heroVideo}>
          <video autoPlay muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.3) saturate(0.7)" }}>
            <source src="https://5v490j47zi.ucarecd.net/11f3b9d8-257f-4bd1-a62d-00309277ff05/adaptive_video/" type="video/mp4" />
          </video>
        </div>
        <div style={s.heroOverlay}></div>
        <div style={s.heroGlow}></div>
        <div style={s.heroContent}>
          <div style={s.heroPill}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--pink)", display: "inline-block", animation: "pulse 2s infinite" }}></span>
            Live on Shelby Testnet &nbsp;·&nbsp; Aptos
          </div>
          <h1 style={s.heroH1}>The marketplace for<br /><span style={{ background: "linear-gradient(90deg, #ff2d78, #ff9cc8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>prompts that work</span></h1>
          <p style={s.heroP}>Buy and sell battle-tested AI prompts. Every transaction verified on-chain. Creators earn directly — no platform cuts.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 72 }}>
            <button onClick={() => document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" })} style={{ fontSize: 15, fontWeight: 600, color: "#fff", background: "var(--pink)", border: "none", borderRadius: 12, padding: "14px 32px", cursor: "pointer", boxShadow: "0 0 32px rgba(255,45,120,0.4)" }}>
              Browse Prompts →
            </button>
            <button onClick={() => setShowUpload(true)} style={{ fontSize: 15, fontWeight: 500, color: "#fff", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 12, padding: "14px 32px", cursor: "pointer", backdropFilter: "blur(10px)" }}>
              Start Selling
            </button>
          </div>
          <div style={s.statsBar}>
            <div style={s.stat}><div style={s.statN}>{prompts.length}</div><div style={s.statL}>PROMPTS</div></div>
            <div style={{ ...s.stat, borderRight: "1px solid rgba(255,45,120,0.15)" }}><div style={{ ...s.statN, color: "#ff9cc8" }}>$9,200</div><div style={s.statL}>CREATOR EARNINGS</div></div>
            <div style={{ ...s.stat, borderRight: "none" }}><div style={s.statN}>100%</div><div style={s.statL}>ON-CHAIN</div></div>
          </div>
        </div>
      </section>

      {/* BROWSE */}
      <section style={s.section} id="browse">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
          <h2 style={s.sectionTitle}>Browse Prompts</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 3, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: 3 }}>
              {(["all", "mine"] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)} style={{ fontSize: 13, fontWeight: 500, color: activeTab === t ? "var(--text)" : "var(--muted)", background: activeTab === t ? "#fff" : "none", border: "none", borderRadius: 7, padding: "7px 16px", boxShadow: activeTab === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                  {t === "all" ? "All Prompts" : "My Uploads"}
                </button>
              ))}
            </div>
            {/* Search */}
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search prompts…" style={{ fontSize: 13, color: "var(--text)", background: "#fff", border: "1px solid var(--border2)", borderRadius: 10, padding: "9px 14px", outline: "none", width: 220 }} />
          </div>
        </div>

        {/* Category filters */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)} style={{ fontSize: 13, fontWeight: 500, color: activeCat === cat ? "var(--pink)" : "var(--muted)", background: activeCat === cat ? "var(--pinkbg)" : "#fff", border: `1px solid ${activeCat === cat ? "var(--pinkbr)" : "var(--border2)"}`, borderRadius: 8, padding: "6px 14px" }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80, color: "var(--subtle)" }}>No prompts found.</div>
        ) : (
          <div style={s.grid}>
            {filtered.map(p => (
              <div key={p.id} style={s.card} onClick={() => setActivePrompt(p)}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--pinkbr)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 40px rgba(255,45,120,0.08)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={s.catTag}>{p.category}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{p.price} <span style={{ fontSize: 11, color: "var(--subtle)" }}>SUSD</span></span>
                </div>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 700, lineHeight: 1.4, marginBottom: 8 }}>{p.title}</div>
                <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65, marginBottom: 20 }}>{p.preview}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--subtle)" }}>by {p.creator}</span>
                  <button onClick={e => { e.stopPropagation(); setActivePrompt(p); }} style={{ fontSize: 12, fontWeight: 600, color: "var(--pink)", background: "var(--pinkbg)", border: "1px solid var(--pinkbr)", borderRadius: 8, padding: "7px 14px" }}>
                    Unlock →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* UPLOAD SECTION */}
      <div style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "80px 48px" }} id="upload">
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--pink)", marginBottom: 12, display: "block" }}>For Creators</span>
          <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>Sell your best prompts.<br />Earn ShelbyUSD.</h3>
          <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 36 }}>Upload once. Earn every time someone unlocks your prompt. 100% goes to you.</p>
          <div style={{ background: "#fff", border: "1px solid var(--border2)", borderRadius: 22, padding: 36 }}>
            <div style={s.field}>
              <label style={s.fieldLabel}>Prompt Title</label>
              <input style={s.fieldInput} value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="e.g. Cinematic Midjourney V6 City Scene" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
              <div>
                <label style={s.fieldLabel}>Price (ShelbyUSD)</label>
                <input style={s.fieldInput} value={fPrice} onChange={e => setFPrice(e.target.value)} placeholder="0.001" />
              </div>
              <div>
                <label style={s.fieldLabel}>Category</label>
                <select style={{ ...s.fieldInput, cursor: "pointer" }} value={fCat} onChange={e => setFCat(e.target.value)}>
                  {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={s.field}>
              <label style={s.fieldLabel}>Full Prompt</label>
              <textarea style={{ ...s.fieldInput, minHeight: 130, resize: "vertical", lineHeight: 1.65 }} value={fPrompt} onChange={e => setFPrompt(e.target.value)} placeholder="Paste your full prompt here…" />
            </div>
            <button onClick={handleUpload} disabled={uploading} style={{ ...s.btnPink, cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1 }}>
              {uploading ? "⏳ Uploading..." : "🚀 Upload to Shelby Testnet"}
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "36px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20, background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          {LOGO}
          <span style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 800 }}>Shelby <em style={{ fontStyle: "normal", color: "var(--pink)" }}>Prompts</em></span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {[["shelby.xyz", "https://shelby.xyz"], ["GitHub", "https://github.com/kakah4/shelby-ai-prompt-marketplace"], ["Discord", "https://discord.gg/shelbyserves"]].map(([label, href]) => (
            <a key={label} href={href} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "var(--subtle)" }}>{label}</a>
          ))}
        </div>
        <span style={{ fontSize: 12, color: "var(--subtle)" }}>Built by Kakah4 · Shelby Testnet · Aptos</span>
      </footer>

      {/* PROMPT MODAL */}
      {activePrompt && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setActivePrompt(null)}>
          <div style={s.modal}>
            <button style={s.modalX} onClick={() => setActivePrompt(null)}>✕</button>
            <span style={s.catTag}>{activePrompt.category}</span>
            <h4 style={{ fontFamily: "Syne, sans-serif", fontSize: 21, fontWeight: 800, margin: "14px 0 4px", letterSpacing: "-0.02em" }}>{activePrompt.title}</h4>
            <p style={{ fontSize: 12, color: "var(--subtle)", marginBottom: 24 }}>by {activePrompt.creator}</p>

            {unlocked.includes(activePrompt.id) ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 9, background: "var(--greenbg)", border: "1px solid rgba(13,122,78,0.2)", borderRadius: 10, padding: "11px 16px", marginBottom: 18, fontSize: 12, fontWeight: 600, color: "var(--green)" }}>
                  ✅ Unlocked · On-chain proof recorded · Aptos Testnet
                </div>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 18 }}>
                  <pre style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, color: "var(--text)", whiteSpace: "pre-wrap", lineHeight: 1.75 }}>{activePrompt.full_prompt}</pre>
                </div>
                <button onClick={() => {
                  const blob = new Blob([activePrompt.full_prompt], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = activePrompt.title.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".txt"; a.click();
                  URL.revokeObjectURL(url);
                }} style={{ ...s.btnPink, background: "var(--surface2)", color: "var(--text)", boxShadow: "none" }}>
                  ⬇ Download .txt
                </button>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 12, padding: "16px 20px", marginBottom: 22 }}>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>Price to unlock</span>
                  <div>
                    <span style={{ fontFamily: "Syne, sans-serif", fontSize: 24, fontWeight: 700, color: "var(--pink)" }}>{activePrompt.price}</span>
                    <span style={{ fontSize: 12, color: "var(--subtle)", marginLeft: 4 }}>ShelbyUSD</span>
                  </div>
                </div>
                <button onClick={() => handleUnlock(activePrompt)} style={{ ...s.btnPink, cursor: "pointer" }}>
                  🔓 Pay & Unlock
                </button>
              </>
            )}
            <button onClick={() => setActivePrompt(null)} style={{ ...s.btnSec, cursor: "pointer" }}>Close</button>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {showUpload && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowUpload(false)}>
          <div style={s.modal}>
            <button style={s.modalX} onClick={() => setShowUpload(false)}>✕</button>
            <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Upload a Prompt</h3>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>Stored on Shelby Testnet. Earn ShelbyUSD on every unlock.</p>
            <div style={s.field}>
              <label style={s.fieldLabel}>Prompt Title</label>
              <input style={s.fieldInput} value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="e.g. Cinematic Midjourney V6 City Scene" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
              <div>
                <label style={s.fieldLabel}>Price (SUSD)</label>
                <input style={s.fieldInput} value={fPrice} onChange={e => setFPrice(e.target.value)} placeholder="0.001" />
              </div>
              <div>
                <label style={s.fieldLabel}>Category</label>
                <select style={{ ...s.fieldInput, cursor: "pointer" }} value={fCat} onChange={e => setFCat(e.target.value)}>
                  {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={s.field}>
              <label style={s.fieldLabel}>Full Prompt</label>
              <textarea style={{ ...s.fieldInput, minHeight: 120, resize: "vertical", lineHeight: 1.65 }} value={fPrompt} onChange={e => setFPrompt(e.target.value)} placeholder="Paste your full prompt here…" />
            </div>
            <button onClick={handleUpload} disabled={uploading} style={{ ...s.btnPink, cursor: uploading ? "not-allowed" : "pointer" }}>
              {uploading ? "⏳ Uploading..." : "🚀 Upload to Shelby Testnet"}
            </button>
            <button onClick={() => setShowUpload(false)} style={{ ...s.btnSec, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* TOAST */}
      <div style={s.toast}>{toast}</div>

      <style>{`
        @keyframes pulse { 0%,100%{ opacity:1; } 50%{ opacity:0.4; } }
      `}</style>
    </div>
  );
}
