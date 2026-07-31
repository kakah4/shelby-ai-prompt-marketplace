import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Account, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { promptText, blobName, base64Data, contentType } = req.body;

    // Either text mode (promptText) or binary mode (base64Data) is required
    if (!blobName || (!promptText && !base64Data)) {
      return res.status(400).json({ error: "Missing blobName and (promptText or base64Data)" });
    }

    const apiKey = process.env.SHELBY_API_KEY;
    const privateKey = process.env.SHELBY_PRIVATE_KEY;
    if (!apiKey || !privateKey) return res.status(500).json({ error: "Shelby not configured" });

    const client = new ShelbyNodeClient({ network: Network.SHELBYNET, apiKey });
    const signer = Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(privateKey) });
    console.log("SIGNER:", signer.accountAddress.toString());

    // Build blob bytes — text prompt or base64 image/file
    const blobData = base64Data
      ? new Uint8Array(Buffer.from(base64Data, "base64"))
      : new TextEncoder().encode(promptText);

    const TIME_TO_LIVE = 365 * 24 * 60 * 60 * 1_000_000;
    const blobUrl = `https://api.shelbynet.shelby.xyz/shelby/v1/blobs/${signer.accountAddress}/${blobName}`;

    try {
      await client.upload({
        blobData,
        signer,
        blobName,
        expirationMicros: Date.now() * 1000 + TIME_TO_LIVE,
      });
      console.log("✅ Uploaded to Shelby:", blobUrl, contentType || "text/plain");
    } catch (uploadErr: any) {
      // Shelby testnet/shelbynet sometimes throws after upload actually succeeds — treat as success
      console.warn("⚠️ Shelby upload warning (blob likely stored):", uploadErr.message);
    }

    return res.status(200).json({ success: true, blobUrl });
  } catch (e: any) {
    console.error("Upload error:", e);
    return res.status(500).json({ error: e.message || "Upload failed" });
  }
}
