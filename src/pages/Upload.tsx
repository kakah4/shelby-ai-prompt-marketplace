import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { styles as s } from "../styles";
import { useToast } from "../components/Toast";
import { insertPrompt } from "../lib/supabase";
import { uploadTextToShelby, uploadFileToShelby } from "../lib/shelby";
import type { PromptRow } from "../types";

function addrToString(address: unknown): string {
  if (!address) return "";
  if (typeof address === "string") return address;
  if (typeof (address as any).toString === "function") return (address as any).toString();
  return String(address);
}

const CATEGORIES = ["Midjourney", "ChatGPT", "Claude", "Stable Diffusion", "Gemini", "Other"];
const MAX_SAMPLE = 2000;
const MAX_IMAGE_MB = 5;

export default function Upload() {
  const { account, connected } = useWallet();
  const showToast = useToast();
  const navigate = useNavigate();
  const addrStr = account ? addrToString(account.address) : "";

  const [uploading, setUploading] = useState(false);
  const [fTitle, setFTitle] = useState("");
  const [fCat, setFCat] = useState("Midjourney");
  const [fPrice, setFPrice] = useState("");
  const [fPrompt, setFPrompt] = useState("");
  const [fSample, setFSample] = useState("");
  const [fImageFile, setFImageFile] = useState<File | null>(null);
  const [fImagePreview, setFImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImagePick = (file: File | null) => {
    if (!file) { setFImageFile(null); setFImagePreview(""); return; }
    if (!file.type.startsWith("image/")) { showToast("Please choose an image file."); return; }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) { showToast(`Image must be under ${MAX_IMAGE_MB}MB.`); return; }
    setFImageFile(file);
    setFImagePreview(URL.createObjectURL(file));
  };

  const sampleCounter = (len: number): React.CSSProperties => ({
    fontSize: 11,
    color: len > MAX_SAMPLE * 0.9 ? "var(--pink)" : "var(--subtle)",
    marginTop: 6,
    display: "flex",
    justifyContent: "space-between",
  });

  const handleUpload = async () => {
    if (!connected || !addrStr) { showToast("Connect your wallet first."); return; }
    if (!fTitle.trim()) { showToast("Enter a title."); return; }
    if (!fPrompt.trim()) { showToast("Paste your prompt."); return; }
    if (!fSample.trim()) { showToast("Add a sample output so buyers can verify quality."); return; }

    setUploading(true);
    showToast("Uploading to Shelby network...");

    try {
      const safeTitle = fTitle.trim().replace(/[^a-zA-Z0-9]/g, "_");
      const blobUrl = await uploadTextToShelby(fPrompt.trim(), `prompts/${Date.now()}_${safeTitle}.txt`);

      let proofImageUrl = "";
      if (fImageFile) {
        showToast("Uploading proof image to Shelby...");
        const ext = fImageFile.name.split(".").pop() || "jpg";
        proofImageUrl = await uploadFileToShelby(fImageFile, `proofs/${Date.now()}_${safeTitle}.${ext}`);
      }

      const newPrompt: PromptRow = {
        id: Date.now(),
        title: fTitle.trim(),
        category: fCat,
        price: fPrice || "0.001",
        preview: fPrompt.trim().slice(0, 100) + "…",
        full_prompt: fPrompt.trim(),
        sample_output: fSample.trim(),
        proof_image_url: proofImageUrl,
        creator: addrStr,
        blob_url: blobUrl,
      };

      await insertPrompt(newPrompt);
      showToast(blobUrl ? "Prompt stored on Shelby network!" : "Prompt uploaded!");
      navigate("/browse");
    } catch (e: any) {
      showToast("Upload failed: " + (e?.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", background: "var(--surface)", minHeight: "100vh", paddingTop: 64 }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "56px 48px" }}>
        <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--pink)", marginBottom: 12, display: "block" }}>For Creators</span>
        <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>Sell your best prompts.<br />Earn ShelbyUSD.</h3>
        <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 36 }}>Upload once. Earn every time someone unlocks your prompt. Stored on Shelby network. 100% goes to you.</p>

        {!connected && (
          <div style={{ background: "var(--pinkbg)", border: "1px solid var(--pinkbr)", borderRadius: 12, padding: "14px 18px", marginBottom: 24, fontSize: 13, color: "var(--pink)" }}>
            Connect your wallet from the top nav before uploading — your address is how buyers pay you.
          </div>
        )}

        <div style={{ background: "#fff", border: "1px solid var(--border2)", borderRadius: 22, padding: 36 }}>
          <div style={s.field}><label style={s.fieldLabel}>Prompt Title</label><input style={s.fieldInput} value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="e.g. Cinematic Midjourney V6 City Scene" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
            <div><label style={s.fieldLabel}>Price (ShelbyUSD)</label><input style={s.fieldInput} value={fPrice} onChange={e => setFPrice(e.target.value)} placeholder="0.001" /></div>
            <div><label style={s.fieldLabel}>Category</label><select style={{ ...s.fieldInput, cursor: "pointer" }} value={fCat} onChange={e => setFCat(e.target.value)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
          </div>
          <div style={s.field}><label style={s.fieldLabel}>Full Prompt</label><textarea style={{ ...s.fieldInput, minHeight: 130, resize: "vertical", lineHeight: 1.65 }} value={fPrompt} onChange={e => setFPrompt(e.target.value)} placeholder="Paste your full prompt here…" /></div>
          <div style={s.field}>
            <label style={s.fieldLabel}>Sample Output / Proof of Quality</label>
            <textarea maxLength={MAX_SAMPLE} style={{ ...s.fieldInput, minHeight: 100, resize: "vertical", lineHeight: 1.65 }} value={fSample} onChange={e => setFSample(e.target.value)} placeholder="Paste a sample result your prompt produced — this is shown to buyers BEFORE they pay, so they can verify quality…" />
            <div style={sampleCounter(fSample.length)}>
              <span>Shown to buyers before they pay. Required.</span>
              <span>{fSample.length} / {MAX_SAMPLE}</span>
            </div>
          </div>
          <div style={s.field}>
            <label style={s.fieldLabel}>Proof Image (optional)</label>
            <div style={s.imgDrop} onClick={() => fileInputRef.current?.click()}>
              {fImagePreview ? (
                <img src={fImagePreview} alt="preview" style={{ maxWidth: "100%", maxHeight: 180, borderRadius: 8, margin: "0 auto", display: "block" }} />
              ) : (
                <div style={{ fontSize: 13, color: "var(--muted)" }}>Click to upload a screenshot or image of the result<br /><span style={{ fontSize: 11, color: "var(--subtle)" }}>PNG, JPG — under {MAX_IMAGE_MB}MB</span></div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleImagePick(e.target.files?.[0] || null)} />
            </div>
            {fImagePreview && (
              <button onClick={() => handleImagePick(null)} style={{ fontSize: 12, color: "var(--pink)", background: "none", border: "none", cursor: "pointer", marginTop: 8 }}>Remove image</button>
            )}
          </div>
          <button onClick={handleUpload} disabled={uploading} style={{ ...s.btnPink, cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1 }}>
            {uploading ? "Uploading to Shelby..." : "Upload to Shelby Network"}
          </button>
        </div>
      </div>
    </div>
  );
}
