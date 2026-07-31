import { Link } from "react-router-dom";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { styles as s } from "../styles";
import { useToast } from "./Toast";

function addrToString(address: unknown): string {
  if (!address) return "";
  if (typeof address === "string") return address;
  if (typeof (address as any).toString === "function") return (address as any).toString();
  return String(address);
}

const LOGO = <img src="/shelby-logo.png" alt="Shelby" style={{ width: 34, height: 34, objectFit: "contain" as const }} />;

export default function Nav() {
  const { account, connected, connect, disconnect } = useWallet();
  const showToast = useToast();
  const addrStr = account ? addrToString(account.address) : "";
  const shortAddr = addrStr ? `${addrStr.slice(0, 6)}...${addrStr.slice(-4)}` : "";

  const handleWallet = async () => {
    if (connected) { disconnect(); return; }
    try { await connect("Petra"); }
    catch (e: any) { showToast("Could not connect: " + (e?.message || "Unknown error")); }
  };

  return (
    <nav style={s.nav}>
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        {LOGO}
        <span style={s.wordmark}>Shelby <em style={s.wordmarkEm}>Prompts</em></span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Link to="/browse" style={s.btnGhost}>Browse</Link>
        <Link to="/sell" style={s.btnGhost}>Sell Prompts</Link>
        {connected && (
          <Link to={`/creator/${addrStr}`} style={s.btnGhost}>My Profile</Link>
        )}
        <button
          onClick={handleWallet}
          style={{
            fontSize: 13, fontWeight: 600, color: "#fff",
            background: connected ? "var(--green)" : "var(--pink)",
            border: "none", borderRadius: 10, padding: "9px 20px",
            display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
          }}
        >
          {connected ? shortAddr : "Connect Wallet"}
        </button>
      </div>
    </nav>
  );
}
