import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { styles as s } from "../styles";
import { useToast } from "../components/Toast";
import PromptCard from "../components/PromptCard";
import PromptModal from "../components/PromptModal";
import { fetchCreator, upsertCreator, fetchPromptsByCreator, deletePrompt, uploadAvatarToSupabase } from "../lib/supabase";
import type { CreatorRow, PromptRow } from "../types";

function addrToString(address: unknown): string {
  if (!address) return "";
  if (typeof address === "string") return address;
  if (typeof (address as any).toString === "function") return (address as any).toString();
  return String(address);
}

const MAX_IMAGE_MB = 5;

export default function CreatorProfile() {
  const { address } = useParams<{ address: string }>();
  const { account } = useWallet();
  const showToast = useToast();
  const myAddr = account ? addrToString(account.address) : "";
  const isOwner = !!address && myAddr.toLowerCase() === address.toLowerCase();

  const [creator, setCreator] = useState<CreatorRow | null>(null);
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [activePrompt, setActivePrompt] = useState<PromptRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PromptRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!address) return;
    fetchCreator(address).then(c => {
      setCreator(c);
      setDisplayName(c?.display_name || "");
      setBio(c?.bio || "");
      setAvatarPreview(c?.avatar_url || "");
    });
    fetchPromptsByCreator(address).then(setPrompts);
  }, [address]);

  const handleAvatarPick = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("Please choose an image file."); return; }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) { showToast(`Image must be under ${MAX_IMAGE_MB}MB.`); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!address) return;
    setSaving(true);
    try {
      let avatarUrl = creator?.avatar_url || "";
      if (avatarFile) {
        showToast("Uploading avatar...");
        const uploaded = await uploadAvatarToSupabase(avatarFile, address);
        if (uploaded) {
          avatarUrl = uploaded;
        } else {
          showToast("Avatar upload failed — keeping your previous avatar.");
        }
      }
      const updated: CreatorRow = { address, display_name: displayName.trim(), bio: bio.trim(), avatar_url: avatarUrl };
      await upsertCreator(updated);
      setCreator(updated);
      setAvatarPreview(avatarUrl);
      setAvatarFile(null);
      setEditing(false);
      showToast("Profile updated!");
    } catch (e: any) {
      showToast("Save failed: " + (e?.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const ok = await deletePrompt(confirmDelete.id);
      if (ok) {
        setPrompts(prev => prev.filter(p => p.id !== confirmDelete.id));
        showToast("Prompt deleted.");
      } else {
        showToast("Could not delete prompt.");
      }
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  if (!address) return null;
  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", background: "#fff", minHeight: "100vh", paddingTop: 64 }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "56px 48px" }}>

        {/* Profile header */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32, flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="" style={{ width: 84, height: 84, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }} />
            ) : (
              <div style={{ width: 84, height: 84, borderRadius: "50%", background: "var(--surface2)", border: "1px solid var(--border)" }} />
            )}
            {editing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ position: "absolute", bottom: -4, right: -4, background: "var(--pink)", color: "#fff", border: "2px solid #fff", borderRadius: "50%", width: 28, height: 28, fontSize: 13, cursor: "pointer" }}
              >
                +
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleAvatarPick(e.target.files?.[0] || null)} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            {editing ? (
              <input
                style={{ ...s.fieldInput, fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 8 }}
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Display name"
              />
            ) : (
              <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
                {creator?.display_name || shortAddr}
              </h2>
            )}
            <p style={{ fontSize: 12, color: "var(--subtle)" }}>{shortAddr}</p>
          </div>
          {isOwner && !editing && (
            <button onClick={() => setEditing(true)} style={{ ...s.btnSec, width: "auto", padding: "10px 20px", cursor: "pointer" }}>Edit Profile</button>
          )}
        </div>

        {editing ? (
          <div style={{ marginBottom: 32 }}>
            <div style={s.field}>
              <label style={s.fieldLabel}>Bio</label>
              <textarea style={{ ...s.fieldInput, minHeight: 90, resize: "vertical", lineHeight: 1.65 }} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell buyers what you're about…" />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleSave} disabled={saving} style={{ ...s.btnPink, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving..." : "Save Profile"}
              </button>
              <button onClick={() => { setEditing(false); setAvatarFile(null); setAvatarPreview(creator?.avatar_url || ""); }} style={{ ...s.btnSec, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        ) : (
          creator?.bio && <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 32, maxWidth: 600 }}>{creator.bio}</p>
        )}

        {/* Their prompts */}
        <h3 style={{ ...s.sectionTitle, marginBottom: 20 }}>{isOwner ? "My Prompts" : "Prompts"} ({prompts.length})</h3>
        {prompts.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--subtle)" }}>No prompts uploaded yet.</div>
        ) : (
          <div style={s.grid}>
            {prompts.map(p => (
              <PromptCard
                key={p.id}
                prompt={p}
                creator={creator}
                onOpen={setActivePrompt}
                onDelete={isOwner ? setConfirmDelete : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {activePrompt && <PromptModal prompt={activePrompt} onClose={() => setActivePrompt(null)} />}

      {confirmDelete && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && !deleting && setConfirmDelete(null)}>
          <div style={{ ...s.modal, maxWidth: 380 }}>
            <h4 style={{ fontFamily: "Syne, sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Delete this prompt?</h4>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24, lineHeight: 1.6 }}>
              "{confirmDelete.title}" will be removed from the marketplace. This can't be undone.
            </p>
            <button onClick={handleDeleteConfirmed} disabled={deleting} style={{ ...s.btnPink, background: "#d92d4c", cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1 }}>
              {deleting ? "Deleting..." : "Delete Prompt"}
            </button>
            <button onClick={() => setConfirmDelete(null)} disabled={deleting} style={{ ...s.btnSec, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
