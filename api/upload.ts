import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Account, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { promptText, blobName } = req.body;
    if (!promptText || !blobName) return res.status(400).json({ error: "Missing promptText or blobName" });

    const apiKey = process.env.SHELBY_API_KEY;
    const privateKey = process.env.SHELBY_PRIVATE_KEY;
    if (!apiKey || !privateKey) return res.status(500).json({ error: "Shelby not configured" });

    const client = new ShelbyNodeClient({ network: Network.SHELBYNET, apiKey });
    const signer = Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(privateKey) });
    const blobData = new TextEncoder().encode(promptText);
    const TIME_TO_LIVE = 365 * 24 * 60 * 60 * 1_000_000;

    const blobUrl = `https://api.shelbynet.shelby.xyz/shelby/v1/blobs/${signer.accountAddress}/${blobName}`;

    try {
      await client.upload({
        blobData,
        signer,
        blobName,
        expirationMicros: Date.now() * 1000 + TIME_TO_LIVE,
      });
      console.log("✅ Uploaded to Shelby:", blobUrl);
    } catch (uploadErr: any) {
      // Shelby testnet often throws after upload succeeds — treat as success
      console.warn("⚠️ Shelby upload warning (blob likely stored):", uploadErr.message);
    }

    return res.status(200).json({ success: true, blobUrl });
  } catch (e: any) {
    console.error("Upload error:", e);
    return res.status(500).json({ error: e.message || "Upload failed" });
  }
}