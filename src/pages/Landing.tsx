import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  const heroStyles: Record<string, React.CSSProperties> = {
    hero: { position: "relative", minHeight: "calc(100vh - 64px)", marginTop: 64, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
    heroOverlay: { position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 55%, rgba(255,255,255,1) 100%)" },
    heroGlow: { position: "absolute", zIndex: 1, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,45,120,0.2) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%, -60%)", pointerEvents: "none" },
    heroContent: { position: "relative", zIndex: 2, maxWidth: 900, margin: "0 auto", textAlign: "center", padding: "80px 48px 140px" },
    heroPill: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#ffaecb", background: "rgba(255,45,120,0.12)", border: "1px solid rgba(255,45,120,0.3)", padding: "6px 16px", borderRadius: 99, marginBottom: 32, backdropFilter: "blur(10px)" },
    heroH1: { fontFamily: "Syne, sans-serif", fontSize: "clamp(46px, 8vw, 84px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.04, color: "#fff", marginBottom: 24 },
    heroP: { fontSize: 18, color: "rgba(255,255,255,0.6)", maxWidth: 480, margin: "0 auto 44px", lineHeight: 1.75, fontWeight: 300 },
    statsBar: { display: "inline-flex", border: "1px solid rgba(255,45,120,0.2)", borderRadius: 16, overflow: "hidden", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(16px)" },
    stat: { padding: "16px 32px", textAlign: "center" as const, borderRight: "1px solid rgba(255,45,120,0.15)" },
    statN: { fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 700, color: "#fff" },
    statL: { fontSize: 11, fontWeight: 500, letterSpacing: "0.05em", color: "rgba(255,255,255,0.4)", marginTop: 2 },
  };

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", background: "#fff", minHeight: "100vh" }}>
      <section style={heroStyles.hero}>
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <video autoPlay muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.3) saturate(0.7)" }}>
            <source src="https://5v490j47zi.ucarecd.net/11f3b9d8-257f-4bd1-a62d-00309277ff05/adaptive_video/" type="video/mp4" />
          </video>
        </div>
        <div style={heroStyles.heroOverlay} />
        <div style={heroStyles.heroGlow} />
        <div style={heroStyles.heroContent}>
          <div style={heroStyles.heroPill}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--pink)", display: "inline-block", animation: "pulse 2s infinite" }} />
            Live on Shelby &nbsp;·&nbsp; Aptos
          </div>
          <h1 style={heroStyles.heroH1}>
            The marketplace for<br />
            <span style={{ background: "linear-gradient(90deg, #ff2d78, #ff9cc8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>prompts that work</span>
          </h1>
          <p style={heroStyles.heroP}>Buy and sell battle-tested AI prompts. Every transaction verified on-chain. Creators earn directly — no platform cuts.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 72 }}>
            <button onClick={() => navigate("/browse")} style={{ fontSize: 15, fontWeight: 600, color: "#fff", background: "var(--pink)", border: "none", borderRadius: 12, padding: "14px 32px", cursor: "pointer", boxShadow: "0 0 32px rgba(255,45,120,0.4)" }}>Browse Prompts →</button>
            <button onClick={() => navigate("/sell")} style={{ fontSize: 15, fontWeight: 500, color: "#fff", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 12, padding: "14px 32px", cursor: "pointer", backdropFilter: "blur(10px)" }}>Start Selling</button>
          </div>
          <div style={heroStyles.statsBar}>
            <div style={heroStyles.stat}><div style={heroStyles.statN}>—</div><div style={heroStyles.statL}>PROMPTS</div></div>
            <div style={{ ...heroStyles.stat, borderRight: "1px solid rgba(255,45,120,0.15)" }}><div style={{ ...heroStyles.statN, color: "#ff9cc8" }}>$9,200</div><div style={heroStyles.statL}>CREATOR EARNINGS</div></div>
            <div style={{ ...heroStyles.stat, borderRight: "none" }}><div style={heroStyles.statN}>100%</div><div style={heroStyles.statL}>ON-CHAIN</div></div>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "36px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20, background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <img src="/shelby-logo.png" alt="Shelby" style={{ width: 34, height: 34, objectFit: "contain" }} />
          <span style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 800 }}>Shelby <em style={{ fontStyle: "normal", color: "var(--pink)" }}>Prompts</em></span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {[["shelby.xyz", "https://shelby.xyz"], ["GitHub", "https://github.com/kakah4/shelby-ai-prompt-marketplace"], ["Discord", "https://discord.gg/shelbyserves"]].map(([label, href]) => (
            <a key={label} href={href} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "var(--subtle)" }}>{label}</a>
          ))}
        </div>
        <span style={{ fontSize: 12, color: "var(--subtle)" }}>Built by Kakah4 · Shelby · Aptos</span>
      </footer>
      <style>{`@keyframes pulse { 0%,100%{ opacity:1; } 50%{ opacity:0.4; } }`}</style>
    </div>
  );
}
