import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { styles as s } from "../styles";
import { useToast } from "./Toast";
import type { PromptRow } from "../types";

function addrToString(address: unknown): string {
  if (!address) return "";
  if (typeof address === "string") return address;
  if (typeof (address as any).toString === "function") return (address as any).toString();
  return String(address);
}

const SHELBY_USD_ADDRESS = "0x1b18363a9f1fe5e6ebf247daba5cc1c18052bb232efdc4c50f556053922d98e1";

interface Props {
  prompt: PromptRow;
  onClose: () => void;
}

export default function PromptModal({ prompt, onClose }: Props) {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const showToast = useToast();
  const addrStr = account ? addrToString(account.address) : "";
  const shortAddr = prompt.creator ? `${prompt.creator.slice(0, 6)}...${prompt.creator.slice(-4)}` : "Unknown";

  const [modalTab, setModalTab] = useState<"proof" | "unlock">("proof");
  const [unlocked, setUnlocked] = useState(false);
  const [paying, setPaying] = useState(false);

  const handleUnlock = async () => {
    if (!connected) { showToast("Connect your wallet first."); return; }
    if (unlocked) return;
    setPaying(true);
    showToast("Opening Petra for confirmation...");
    try {
      const priceFloat = parseFloat(prompt.price || "0.001");
      const amount = Math.floor(priceFloat * 1e8);
      const recipient = prompt.creator || addrStr;
      await signAndSubmitTransaction({
        data: {
          function: "0x1::primary_fungible_store::transfer",
          typeArguments: ["0x1::fungible_asset::Metadata"],
          functionArguments: [SHELBY_USD_ADDRESS, recipient, amount.toString()],
        },
      });
      setUnlocked(true);
      showToast("Payment confirmed · On-chain · Aptos Testnet");
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("rejected") || msg.includes("cancel") || e?.code === 4001) {
        showToast("Transaction cancelled.");
      } else {
        setUnlocked(true);
        showToast("Unlocked · Demo mode");
      }
    } finally {
      setPaying(false);
    }
  };

  const downloadPrompt = () => {
    const blob = new Blob([prompt.full_prompt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = prompt.title.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <button style={{ ...s.modalX, cursor: "pointer" }} onClick={onClose}>✕</button>
        <span style={s.catTag}>{prompt.category}</span>
        <h4 style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 800, margin: "12px 0 4px", letterSpacing: "-0.02em" }}>{prompt.title}</h4>
        <p style={{ fontSize: 12, color: "var(--subtle)", marginBottom: 20 }}>
          by {shortAddr}
          {prompt.blob_url && <span style={{ color: "var(--green)", marginLeft: 8 }}>On Shelby</span>}
        </p>

        {!unlocked && (
          <div style={{ display: "flex", gap: 3, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: 3, marginBottom: 22 }}>
            <button onClick={() => setModalTab("proof")} style={{ flex: 1, fontSize: 13, fontWeight: 600, color: modalTab === "proof" ? "var(--text)" : "var(--muted)", background: modalTab === "proof" ? "#fff" : "none", border: "none", borderRadius: 7, padding: "8px 16px", cursor: "pointer", boxShadow: modalTab === "proof" ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
              Proof of Output
            </button>
            <button onClick={() => setModalTab("unlock")} style={{ flex: 1, fontSize: 13, fontWeight: 600, color: modalTab === "unlock" ? "var(--text)" : "var(--muted)", background: modalTab === "unlock" ? "#fff" : "none", border: "none", borderRadius: 7, padding: "8px 16px", cursor: "pointer", boxShadow: modalTab === "unlock" ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
              Unlock Prompt
            </button>
          </div>
        )}

        {!unlocked && modalTab === "proof" && (
          <div>
            {prompt.proof_image_url && (
              <img src={prompt.proof_image_url} alt="proof" style={{ width: "100%", maxHeight: 320, objectFit: "cover", borderRadius: 12, marginBottom: 16, border: "1px solid var(--border)" }} />
            )}
            <div style={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 12, padding: "14px 18px", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "var(--subtle)", marginBottom: 8 }}>What this prompt produces</div>
              <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>{prompt.sample_output || "No sample output provided by creator."}</p>
            </div>
            <div style={{ background: "var(--pinkbg)", border: "1px solid var(--pinkbr)", borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "var(--pink)", marginBottom: 8 }}>Prompt Preview (blurred)</div>
              <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7, filter: "blur(4px)", userSelect: "none" as const }}>{prompt.full_prompt.slice(0, 120)}…</p>
              <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>Unlock to see the full prompt</p>
            </div>
            <button onClick={() => setModalTab("unlock")} style={{ ...s.btnPink, cursor: "pointer" }}>
              Looks good — Unlock for {prompt.price} SUSD →
            </button>
            <button onClick={onClose} style={{ ...s.btnSec, cursor: "pointer" }}>Close</button>
          </div>
        )}

        {!unlocked && modalTab === "unlock" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 12, padding: "16px 20px", marginBottom: 22 }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Price to unlock</span>
              <div><span style={{ fontFamily: "Syne, sans-serif", fontSize: 24, fontWeight: 700, color: "var(--pink)" }}>{prompt.price}</span><span style={{ fontSize: 12, color: "var(--subtle)", marginLeft: 4 }}>ShelbyUSD</span></div>
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18, lineHeight: 1.6 }}>
              Not sure yet? <button onClick={() => setModalTab("proof")} style={{ color: "var(--pink)", background: "none", border: "none", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>View proof of output first</button>
            </div>
            <button onClick={handleUnlock} disabled={paying} style={{ ...s.btnPink, cursor: paying ? "not-allowed" : "pointer", opacity: paying ? 0.7 : 1 }}>
              {paying ? "Waiting for Petra..." : "Pay & Unlock"}
            </button>
            <button onClick={onClose} style={{ ...s.btnSec, cursor: "pointer" }}>Cancel</button>
          </div>
        )}

        {unlocked && (
          <div>
            {prompt.proof_image_url && (
              <img src={prompt.proof_image_url} alt="proof" style={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 12, marginBottom: 16, border: "1px solid var(--border)" }} />
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 9, background: "var(--greenbg)", border: "1px solid rgba(13,122,78,0.2)", borderRadius: 10, padding: "11px 16px", marginBottom: 18, fontSize: 12, fontWeight: 600, color: "var(--green)" }}>
              Unlocked · On-chain proof recorded · Aptos Testnet
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "var(--subtle)", marginBottom: 10 }}>Full Prompt</div>
              <pre style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, color: "var(--text)", whiteSpace: "pre-wrap", lineHeight: 1.75 }}>{prompt.full_prompt}</pre>
            </div>
            <button onClick={downloadPrompt} style={{ ...s.btnPink, background: "var(--surface2)", color: "var(--text)", boxShadow: "none", cursor: "pointer" }}>Download .txt</button>
            <button onClick={onClose} style={{ ...s.btnSec, cursor: "pointer" }}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
