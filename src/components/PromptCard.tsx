import { Link } from "react-router-dom";
import { styles as s } from "../styles";
import type { PromptRow, CreatorRow } from "../types";

interface Props {
  prompt: PromptRow;
  creator?: CreatorRow | null;
  onOpen: (p: PromptRow) => void;
  onDelete?: (p: PromptRow) => void;
}

export default function PromptCard({ prompt: p, creator, onOpen, onDelete }: Props) {
  const shortAddr = p.creator ? `${p.creator.slice(0, 6)}...${p.creator.slice(-4)}` : "Unknown";

  return (
    <div
      style={s.card}
      onClick={() => onOpen(p)}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--pinkbr)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 40px rgba(255,45,120,0.08)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
    >
      {onDelete && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(p); }}
          title="Delete this prompt"
          style={{ position: "absolute", top: 14, right: 14, zIndex: 2, background: "#fff", border: "1px solid var(--border)", color: "var(--pink)", borderRadius: 8, width: 28, height: 28, fontSize: 13, cursor: "pointer" }}
        >
          ✕
        </button>
      )}
      {p.proof_image_url && <img src={p.proof_image_url} alt={p.title} style={s.cardImg} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={s.catTag}>{p.category}</span>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{p.price} <span style={{ fontSize: 11, color: "var(--subtle)" }}>SUSD</span></span>
      </div>
      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 700, lineHeight: 1.4, marginBottom: 8 }}>{p.title}</div>
      <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65, marginBottom: 12 }}>{p.preview}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {p.sample_output && (
          <div style={{ fontSize: 11, color: "var(--green)", background: "var(--greenbg)", border: "1px solid rgba(13,122,78,0.15)", borderRadius: 6, padding: "4px 10px" }}>
            Written proof
          </div>
        )}
        {p.proof_image_url && (
          <div style={{ fontSize: 11, color: "var(--green)", background: "var(--greenbg)", border: "1px solid rgba(13,122,78,0.15)", borderRadius: 6, padding: "4px 10px" }}>
            Visual proof
          </div>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link
          to={`/creator/${p.creator}`}
          onClick={e => e.stopPropagation()}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--subtle)", textDecoration: "none" }}
        >
          {creator?.avatar_url ? (
            <img src={creator.avatar_url} alt="" style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--surface2)", display: "inline-block" }} />
          )}
          {creator?.display_name || shortAddr}
        </Link>
        <button
          onClick={e => { e.stopPropagation(); onOpen(p); }}
          style={{ fontSize: 12, fontWeight: 600, color: "var(--pink)", background: "var(--pinkbg)", border: "1px solid var(--pinkbr)", borderRadius: 8, padding: "7px 14px", cursor: "pointer" }}
        >
          View & Unlock →
        </button>
      </div>
      {p.blob_url && (
        <div style={{ marginTop: 10, fontSize: 11, color: "var(--subtle)" }}>Stored on Shelby</div>
      )}
    </div>
  );
}
